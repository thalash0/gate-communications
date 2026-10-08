/* GB — tiny widget library for the book. No dependencies except three.js (3D widgets). */
(function(){
'use strict';
const GB = window.GB = {};
const TAU = Math.PI*2;

/* ================= math helpers ================= */
const M = GB.m = {};
M.TAU = TAU;
M.linspace = (a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
M.sinc = x => Math.abs(x)<1e-9?1:Math.sin(Math.PI*x)/(Math.PI*x);
M.clamp = (x,a,b)=>Math.min(b,Math.max(a,x));
M.erf = function(x){
  const s = x<0?-1:1; x=Math.abs(x);
  if(x>=3) return s*(1-M.erfc(x));
  let sum=x, term=x; // erf = 2/sqrt(pi) e^{-x^2} sum 2^n x^(2n+1)/(2n+1)!!
  for(let n=1;n<200;n++){ term*= 2*x*x/(2*n+1); sum+=term; if(term<1e-17*sum) break; }
  return s*2/Math.sqrt(Math.PI)*Math.exp(-x*x)*sum;
};
M.erfc = function(x){
  if(x<0) return 2-M.erfc(-x);
  if(x<2.5) return 1-M.erf(x);
  let f=x; for(let k=80;k>=1;k--) f = x + (k/2)/f;
  return Math.exp(-x*x)/(Math.sqrt(Math.PI)*f);
};
M.Q = x => 0.5*M.erfc(x/Math.SQRT2);
M.Qinv = function(p){ let lo=-10,hi=10; for(let i=0;i<80;i++){const m=(lo+hi)/2; if(M.Q(m)>p) lo=m; else hi=m;} return (lo+hi)/2; };
M.gauss = (x,m=0,s=1)=>Math.exp(-0.5*((x-m)/s)**2)/(s*Math.sqrt(TAU));
M.H = p => (p<=0||p>=1)?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
M.log2 = Math.log2;
M.db = x => 10*Math.log10(x);
M.undb = x => Math.pow(10,x/10);
M.besselJ = function(n,x){ // (1/pi) int_0^pi cos(n t - x sin t) dt ; trapezoid is spectrally accurate
  const N=240; let s=0; for(let i=0;i<=N;i++){const t=Math.PI*i/N; const w=(i===0||i===N)?0.5:1; s+=w*Math.cos(n*t-x*Math.sin(t));} return s/N;
};
M.rng = function(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; };
M.randn = function(r){ let u=0,v=0; while(u===0)u=r(); v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
M.fft = function(re,im){ // in place radix-2
  const n=re.length; for(let i=1,j=0;i<n;i++){ let b=n>>1; for(;j&b;b>>=1) j^=b; j^=b; if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;} }
  for(let len=2;len<=n;len<<=1){ const ang=-TAU/len, wr=Math.cos(ang), wi=Math.sin(ang);
    for(let i=0;i<n;i+=len){ let cr=1,ci=0; for(let k=0;k<len/2;k++){ const a=i+k,b=i+k+len/2;
      const xr=re[b]*cr-im[b]*ci, xi=re[b]*ci+im[b]*cr; re[b]=re[a]-xr; im[b]=im[a]-xi; re[a]+=xr; im[a]+=xi;
      const t=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=t; } } }
};
/* one-sided amplitude spectrum of a real signal sampled at fs: returns {f:[], a:[]} (a = |X|/N*2) */
M.spectrum = function(x,fs){ const n=x.length, re=Float64Array.from(x), im=new Float64Array(n); M.fft(re,im);
  const f=[],a=[]; for(let k=0;k<=n/2;k++){ f.push(k*fs/n); a.push((k===0||k===n/2?1:2)*Math.hypot(re[k],im[k])/n); } return {f,a}; };
M.hann = n => Array.from({length:n},(_,i)=>0.5-0.5*Math.cos(TAU*i/n));

/* ================= colours / theme ================= */
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
GB.colors = function(){ const o={}; ['bg','panel','panel2','fg','mute','grid','axis','blue','yellow','green','red','purple','orange','teal','pink'].forEach(k=>o[k]=cssv('--'+k)); return o; };
const col = (C,c)=> (c&&C[c])?C[c]:(c||C.fg);

/* ================= canvas graphics ================= */
function niceStep(range,n){ const raw=range/n, p=Math.pow(10,Math.floor(Math.log10(raw))), f=raw/p; return (f<1.5?1:f<3?2:f<7?5:10)*p; }
function fmtNum(v){ if(Math.abs(v)<1e-12) return '0'; const a=Math.abs(v); if(a>=1e4||a<1e-3) return v.toExponential(0).replace('e+','e'); return String(+v.toPrecision(3)); }
GB.fmt = fmtNum;

class V{ // a plotting panel with data->pixel mapping
  constructor(g,x,y,w,h){ this.g=g; this.px=x; this.py=y; this.pw=w; this.ph=h; this.view(-1,1,-1,1); }
  view(x0,x1,y0,y1,o){ o=o||{};
    if(o.equal){ const ax=this.pw/(x1-x0), ay=this.ph/(y1-y0), s=Math.min(ax,ay); const cx=(x0+x1)/2, cy=(y0+y1)/2; x0=cx-this.pw/s/2; x1=cx+this.pw/s/2; y0=cy-this.ph/s/2; y1=cy+this.ph/s/2; }
    this.x0=x0;this.x1=x1;this.y0=y0;this.y1=y1; return this; }
  X(x){ return this.px+(x-this.x0)/(this.x1-this.x0)*this.pw; }
  Y(y){ return this.py+this.ph-(y-this.y0)/(this.y1-this.y0)*this.ph; }
  clip(){ const c=this.g.ctx; c.save(); c.beginPath(); c.rect(this.px,this.py-2,this.pw,this.ph+4); c.clip(); }
  unclip(){ this.g.ctx.restore(); }
  axes(o){ o=o||{}; const g=this.g, c=g.ctx, C=g.C;
    c.save(); c.lineWidth=1; c.font='11px '+getComputedStyle(document.body).getPropertyValue('--sans'); c.textBaseline='top';
    const xs=o.xstep||niceStep(this.x1-this.x0,Math.max(2,Math.floor(this.pw/80))), ys=o.ystep||niceStep(this.y1-this.y0,Math.max(2,Math.floor(this.ph/46)));
    const xa=(this.y0<=0&&this.y1>=0&&!o.xbottom)?this.Y(0):this.py+this.ph, ya=(this.x0<=0&&this.x1>=0&&!o.yleft)?this.X(0):this.px;
    const xt=o.xticks||(o.nox?[]:ticks(this.x0,this.x1,xs)), yt=o.yticks||(o.noy?[]:ticks(this.y0,this.y1,ys));
    if(o.grid!==false){ c.strokeStyle=C.grid; c.beginPath(); xt.forEach(t=>{const X=this.X(t[0]); c.moveTo(X,this.py); c.lineTo(X,this.py+this.ph);}); yt.forEach(t=>{const Y=this.Y(t[0]); c.moveTo(this.px,Y); c.lineTo(this.px+this.pw,Y);}); c.stroke(); }
    c.strokeStyle=C.axis; c.fillStyle=C.mute; c.lineWidth=1.3;
    if(!o.nox){ c.beginPath(); c.moveTo(this.px,xa); c.lineTo(this.px+this.pw,xa); c.stroke(); }
    if(!o.noy){ c.beginPath(); c.moveTo(ya,this.py); c.lineTo(ya,this.py+this.ph); c.stroke(); }
    c.textAlign='center'; xt.forEach(t=>{ if(Math.abs(t[0])<1e-12&&!o.xticks&&xa<this.py+this.ph-1&&ya>this.px) return; const X=this.X(t[0]); c.fillText(t[1],X,Math.min(xa+3,this.py+this.ph+2)); });
    c.textAlign='right'; c.textBaseline='middle'; yt.forEach(t=>{ if(Math.abs(t[0])<1e-12&&!o.yticks&&ya>this.px) return; c.fillText(t[1],Math.max(ya-4,this.px-3),this.Y(t[0])); });
    c.fillStyle=C.fg; c.textBaseline='alphabetic';
    if(o.xl){ c.textAlign='right'; c.fillText(o.xl,this.px+this.pw-2,Math.min(xa-4,this.py+this.ph-4)); }
    if(o.yl){ c.textAlign='left'; c.fillText(o.yl,Math.max(ya+5,this.px+5),this.py+11); }
    c.restore(); return this;
    function ticks(a,b,s){ const r=[]; for(let v=Math.ceil(a/s-1e-9)*s; v<=b+1e-9; v+=s){ const vv=Math.abs(v)<s*1e-6?0:v; r.push([vv,fmtNum(+vv.toFixed(10))]); } return r; } }
  title(s,color){ const c=this.g.ctx; c.save(); c.font='600 12px '+getComputedStyle(document.body).getPropertyValue('--sans'); c.fillStyle=col(this.g.C,color||'blue'); c.textAlign='left'; c.textBaseline='alphabetic'; c.fillText(s,this.px+4,this.py-5); c.restore(); return this; }
  line(xs,ys,color,w,dash){ const c=this.g.ctx; this.clip(); c.strokeStyle=col(this.g.C,color); c.lineWidth=w||2; c.lineJoin='round'; if(dash) c.setLineDash(dash); c.beginPath();
    let st=false; for(let i=0;i<xs.length;i++){ const y=ys[i]; if(!isFinite(y)){st=false;continue;} const X=this.X(xs[i]), Y=this.Y(y); if(!st){c.moveTo(X,Y);st=true;} else c.lineTo(X,Y); } c.stroke(); this.unclip(); return this; }
  fn(f,color,w,dash,N){ N=N||Math.max(120,Math.floor(this.pw)); const xs=[],ys=[]; for(let i=0;i<=N;i++){ const x=this.x0+(this.x1-this.x0)*i/N; xs.push(x); ys.push(f(x)); } return this.line(xs,ys,color,w,dash); }
  fill(fa,fb,color,alpha,N){ const c=this.g.ctx; N=N||Math.max(120,Math.floor(this.pw)); this.clip(); c.globalAlpha=alpha==null?0.25:alpha; c.fillStyle=col(this.g.C,color||'blue'); c.beginPath();
    for(let i=0;i<=N;i++){ const x=this.x0+(this.x1-this.x0)*i/N; const X=this.X(x),Y=this.Y(fa(x)); i?c.lineTo(X,Y):c.moveTo(X,Y); }
    for(let i=N;i>=0;i--){ const x=this.x0+(this.x1-this.x0)*i/N; c.lineTo(this.X(x),this.Y(fb?fb(x):0)); } c.closePath(); c.fill(); c.globalAlpha=1; this.unclip(); return this; }
  stem(xs,ys,color,w,r){ const c=this.g.ctx; c.save(); c.strokeStyle=col(this.g.C,color); c.fillStyle=c.strokeStyle; c.lineWidth=w||2; xs.forEach((x,i)=>{ const X=this.X(x), Y0=this.Y(0), Y=this.Y(ys[i]); c.beginPath(); c.moveTo(X,Y0); c.lineTo(X,Y); c.stroke(); c.beginPath(); c.arc(X,Y,r==null?3.2:r,0,TAU); c.fill(); }); c.restore(); return this; }
  bars(xs,ys,wd,color,alpha){ const c=this.g.ctx; c.save(); c.fillStyle=col(this.g.C,color); c.globalAlpha=alpha==null?0.85:alpha; xs.forEach((x,i)=>{ const X0=this.X(x-wd/2), X1=this.X(x+wd/2), Y0=this.Y(0), Y=this.Y(ys[i]); c.fillRect(X0,Math.min(Y,Y0),Math.max(1,X1-X0-1),Math.abs(Y0-Y)); }); c.restore(); return this; }
  dot(x,y,color,r){ const c=this.g.ctx; c.fillStyle=col(this.g.C,color); c.beginPath(); c.arc(this.X(x),this.Y(y),r||4,0,TAU); c.fill(); return this; }
  ring(x,y,color,r,w){ const c=this.g.ctx; c.strokeStyle=col(this.g.C,color); c.lineWidth=w||2; c.beginPath(); c.arc(this.X(x),this.Y(y),r||5,0,TAU); c.stroke(); return this; }
  circle(x,y,r,color,w,dash){ const c=this.g.ctx; c.save(); c.strokeStyle=col(this.g.C,color); c.lineWidth=w||1.5; if(dash)c.setLineDash(dash); c.beginPath(); c.ellipse(this.X(x),this.Y(y),Math.abs(this.X(x+r)-this.X(x)),Math.abs(this.Y(y+r)-this.Y(y)),0,0,TAU); c.stroke(); c.restore(); return this; }
  text(x,y,s,color,align,size,dx,dy){ const c=this.g.ctx; c.save(); c.font=(size||12)+'px '+getComputedStyle(document.body).getPropertyValue('--sans'); c.fillStyle=col(this.g.C,color); c.textAlign=align||'left'; c.textBaseline='middle'; c.fillText(s,this.X(x)+(dx||0),this.Y(y)+(dy||0)); c.restore(); return this; }
  arrow(x1,y1,x2,y2,color,w,head){ const c=this.g.ctx, X1=this.X(x1),Y1=this.Y(y1),X2=this.X(x2),Y2=this.Y(y2); const a=Math.atan2(Y2-Y1,X2-X1), h=head||9; c.save(); c.strokeStyle=c.fillStyle=col(this.g.C,color); c.lineWidth=w||2;
    c.beginPath(); c.moveTo(X1,Y1); c.lineTo(X2-Math.cos(a)*h*0.6,Y2-Math.sin(a)*h*0.6); c.stroke(); c.beginPath(); c.moveTo(X2,Y2); c.lineTo(X2-h*Math.cos(a-0.4),Y2-h*Math.sin(a-0.4)); c.lineTo(X2-h*Math.cos(a+0.4),Y2-h*Math.sin(a+0.4)); c.closePath(); c.fill(); c.restore(); return this; }
  seg(x1,y1,x2,y2,color,w,dash){ const c=this.g.ctx; c.save(); c.strokeStyle=col(this.g.C,color); c.lineWidth=w||1.5; if(dash)c.setLineDash(dash); c.beginPath(); c.moveTo(this.X(x1),this.Y(y1)); c.lineTo(this.X(x2),this.Y(y2)); c.stroke(); c.restore(); return this; }
  hline(y,color,dash,w){ return this.seg(this.x0,y,this.x1,y,color||'axis',w||1.2,dash||[5,4]); }
  vline(x,color,dash,w){ return this.seg(x,this.y0,x,this.y1,color||'axis',w||1.2,dash||[5,4]); }
  rect(x0,y0,x1,y1,color,alpha){ const c=this.g.ctx; c.save(); c.globalAlpha=alpha==null?0.2:alpha; c.fillStyle=col(this.g.C,color); const X0=this.X(x0),X1=this.X(x1),Y0=this.Y(y0),Y1=this.Y(y1); c.fillRect(Math.min(X0,X1),Math.min(Y0,Y1),Math.abs(X1-X0),Math.abs(Y1-Y0)); c.restore(); return this; }
  poly(pts,color,alpha){ const c=this.g.ctx; c.save(); c.globalAlpha=alpha==null?0.3:alpha; c.fillStyle=col(this.g.C,color); c.beginPath(); pts.forEach((p,i)=>{const X=this.X(p[0]),Y=this.Y(p[1]); i?c.lineTo(X,Y):c.moveTo(X,Y);}); c.closePath(); c.fill(); c.restore(); return this; }
}

class G{
  constructor(canvas,w,h,C){ this.cv=canvas; this.ctx=canvas.getContext('2d'); this.w=w; this.h=h; this.C=C; }
  clear(){ const c=this.ctx; c.clearRect(0,0,this.w,this.h); return this; }
  /* panel i of n stacked vertically (or grid when o.cols given) */
  panel(i,n,o){ o=o||{}; const pad=Object.assign({l:o.narrow?14:40,r:12,t:22,b:20},o.pad||{}); const cols=o.cols||1, rows=Math.ceil(n/cols); const sw=this.w/cols, sh=this.h/rows; const cx=i%cols, cy=Math.floor(i/cols);
    return new V(this,cx*sw+pad.l,cy*sh+pad.t,sw-pad.l-pad.r,sh-pad.t-pad.b); }
  full(pad){ pad=Object.assign({l:40,r:12,t:20,b:22},pad||{}); return new V(this,pad.l,pad.t,this.w-pad.l-pad.r,this.h-pad.t-pad.b); }
  legend(items,x,y,vertical){ const c=this.ctx; c.save(); c.font='12px '+getComputedStyle(document.body).getPropertyValue('--sans'); c.textBaseline='middle'; let cx=x,cy=y;
    items.forEach(it=>{ c.fillStyle=col(this.C,it[1]); c.fillRect(cx,cy-4,14,3); c.fillStyle=this.C.fg; c.textAlign='left'; c.fillText(it[0],cx+19,cy-2); const wd=c.measureText(it[0]).width+34; if(vertical) cy+=17; else cx+=wd; }); c.restore(); }
  text(x,y,s,color,align,size){ const c=this.ctx; c.save(); c.font=(size||12)+'px '+getComputedStyle(document.body).getPropertyValue('--sans'); c.fillStyle=col(this.C,color); c.textAlign=align||'left'; c.textBaseline='middle'; c.fillText(s,x,y); c.restore(); }
}
GB.G=G; GB.V=V;

/* ================= widget scheduler ================= */
let widgets=[], raf=0, last=0;
function kick(){ if(!raf) raf=requestAnimationFrame(frame); }
function frame(ts){ raf=0; const dt=Math.min(0.1,(ts-(last||ts))/1000); last=ts; let again=false;
  widgets.forEach(w=>{ if(!w.visible) return; if(w.playing||w.dirty){ if(w.playing) w.t+=dt*(w.spec.speed||1); w.render(); } if(w.playing) again=true; });
  if(again) kick(); else last=0; }
GB.reset = function(){ widgets.forEach(w=>w.destroy&&w.destroy()); widgets=[]; };
document.addEventListener('gb-theme',()=>{ widgets.forEach(w=>w.themeChanged&&w.themeChanged()); kick(); });
const io = ('IntersectionObserver' in window)? new IntersectionObserver(es=>{ es.forEach(e=>{ const w=e.target.__w; if(!w) return; w.visible=e.isIntersecting; if(w.visible){ w.onShow&&w.onShow(); w.dirty=true; kick(); } else w.onHide&&w.onHide(); }); },{rootMargin:'120px'}) : null;

function buildShell(root,spec,hasCanvas){
  const cap=root.innerHTML; root.innerHTML=''; root.classList.add('widget');
  if(spec.title){ const t=document.createElement('div'); t.className='w-title'; t.textContent=spec.title; root.appendChild(t); }
  const stage=document.createElement('div'); stage.className='w-stage'; root.appendChild(stage);
  const rd=document.createElement('div'); rd.className='w-read'; root.appendChild(rd);
  const ctrl=document.createElement('div'); ctrl.className='w-ctrl'; root.appendChild(ctrl);
  const cp=document.createElement('div'); cp.className='w-cap'; cp.innerHTML=cap; root.appendChild(cp);
  return {stage,rd,ctrl};
}
function buildControls(w,ctrlEl){
  const spec=w.spec, p=w.p;
  (spec.controls||[]).forEach(c=>{
    if(c.type==='button'){ const b=document.createElement('button'); b.textContent=c.label; b.onclick=()=>{ c.fn&&c.fn(p,w); w.dirty=true; kick(); }; ctrlEl.appendChild(b); return; }
    const lab=document.createElement('label');
    if(c.type==='select'){ lab.innerHTML='<div class="row"><span>'+c.label+'</span></div>'; const s=document.createElement('select'); c.options.forEach((o,i)=>{ const op=document.createElement('option'); op.value=i; op.textContent=o[1]; s.appendChild(op); });
      const init=c.options.findIndex(o=>o[0]===c.value); s.value=init<0?0:init; p[c.k]=c.options[+s.value][0]; s.onchange=()=>{ p[c.k]=c.options[+s.value][0]; c.on&&c.on(p,w); w.dirty=true; kick(); }; lab.appendChild(s); }
    else if(c.type==='check'){ lab.className='chk'; const i=document.createElement('input'); i.type='checkbox'; i.checked=!!c.value; p[c.k]=!!c.value; i.onchange=()=>{ p[c.k]=i.checked; w.dirty=true; kick(); }; lab.appendChild(i); const s=document.createElement('span'); s.textContent=c.label; lab.appendChild(s); }
    else { lab.innerHTML='<div class="row"><span>'+c.label+'</span><span class="val"></span></div>'; const i=document.createElement('input'); i.type='range'; i.min=c.min; i.max=c.max; i.step=c.step||(c.max-c.min)/100; i.value=c.value; const v=lab.querySelector('.val');
      const upd=()=>{ p[c.k]=+i.value; v.textContent=c.fmt?c.fmt(p[c.k]):(+(+i.value).toPrecision(4))+(c.unit||''); }; upd(); i.oninput=()=>{ upd(); c.on&&c.on(p,w); w.dirty=true; kick(); }; lab.appendChild(i); }
    ctrlEl.appendChild(lab); });
  if(spec.anim){ const b=document.createElement('button'); const set=()=>{ b.textContent=w.playing?'⏸ Pause':'▶ Play'; }; w.playing=spec.play!==false; set(); b.onclick=()=>{ w.playing=!w.playing; set(); w.dirty=true; kick(); }; ctrlEl.appendChild(b); }
}

/* 2D canvas widget: spec = {title,h,hm,controls:[...],anim,speed,play,draw(g,p,t)->optional readout html} */
GB.widget = function(id,spec){
  const root=document.getElementById(id); if(!root){ console.warn('widget root missing',id); return; }
  const sh=buildShell(root,spec), cv=document.createElement('canvas'); sh.stage.appendChild(cv);
  const w={spec,p:{},t:spec.t0||0,visible:!io,dirty:true,playing:false,root};
  buildControls(w,sh.ctrl);
  let W=0,H=0;
  w.render=function(){ w.dirty=false;
    const cw=Math.max(200,sh.stage.clientWidth); const hh=(cw<520&&spec.hm)?spec.hm:(spec.h||260); const dpr=Math.min(window.devicePixelRatio||1,2.5);
    if(cw!==W||hh!==H){ W=cw;H=hh; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.height=H+'px'; }
    const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=new G(cv,W,H,GB.colors()); g.clear();
    try{ const r=spec.draw(g,w.p,w.t,w); if(typeof r==='string') sh.rd.innerHTML=r; }
    catch(e){ console.error('widget '+id,e); if(!root.querySelector('.w-err')){ const d=document.createElement('div'); d.className='w-err'; d.textContent='widget error: '+e.message; root.appendChild(d);} } };
  w.themeChanged=()=>{ w.dirty=true; };
  w.destroy=()=>{ if(io) io.unobserve(root); ro&&ro.disconnect(); };
  const ro=('ResizeObserver' in window)?new ResizeObserver(()=>{ w.dirty=true; kick(); }):null; ro&&ro.observe(sh.stage);
  root.__w=w; widgets.push(w); if(io) io.observe(root); else kick();
  w.render(); return w;
};

/* ================= 3D widget (three.js) ================= */
GB.three = function(id,spec){
  const root=document.getElementById(id); if(!root) return;
  const sh=buildShell(root,spec); const w={spec,p:{},t:0,visible:!io,dirty:true,playing:false,root};
  buildControls(w,sh.ctrl);
  const cam0=Object.assign({r:7,theta:0.7,phi:0.45},spec.cam||{}); let st=null, renderer=null, scene=null, camera=null, drag=null;
  const THREE=window.THREE;
  function boot(){
    if(!THREE){ sh.stage.innerHTML='<div class="w-err">three.js not available</div>'; return false; }
    if(renderer) return true;
    try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false}); }catch(e){ sh.stage.innerHTML='<div class="w-err">WebGL unavailable on this device ('+e.message+')</div>'; return false; }
    const dpr=Math.min(window.devicePixelRatio||1,2); renderer.setPixelRatio(dpr); renderer.setClearColor(0x000000,0);
    const hh=spec.h||320; const cw=Math.max(200,sh.stage.clientWidth); renderer.setSize(cw,hh); renderer.domElement.style.height=hh+'px'; renderer.domElement.style.touchAction='pan-y'; sh.stage.appendChild(renderer.domElement);
    scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(spec.fov||40,cw/hh,0.1,200);
    w.cam={r:cam0.r,theta:cam0.theta,phi:cam0.phi};
    st=spec.setup({THREE,scene,camera,C:GB.colors(),G3:G3(THREE),p:w.p,w})||{};
    const el=renderer.domElement; let lx=0,ly=0;
    el.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,id:e.pointerId}; lx=e.clientX; ly=e.clientY; try{el.setPointerCapture(e.pointerId);}catch(_){}; w.spin=false; });
    el.addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY; w.cam.theta-=dx*0.008; if(e.pointerType==='mouse') w.cam.phi=M.clamp(w.cam.phi+dy*0.008,-1.45,1.45); w.dirty=true; kick(); });
    const up=()=>{ drag=null; }; el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
    el.addEventListener('wheel',e=>{ if(!e.ctrlKey&&!e.shiftKey) return; e.preventDefault(); w.cam.r=M.clamp(w.cam.r*(1+e.deltaY*0.001),2,30); w.dirty=true; kick(); },{passive:false});
    return true; }
  w.render=function(){ w.dirty=false; if(!boot()) return;
    const cw=Math.max(200,sh.stage.clientWidth), hh=spec.h||320; if(renderer.domElement.clientWidth!==cw){ renderer.setSize(cw,hh); camera.aspect=cw/hh; camera.updateProjectionMatrix(); }
    try{ if(spec.spin&&!drag&&w.spin!==false) w.cam.theta+=0.004*spec.spin;
      const r=spec.update&&spec.update(st,w.p,w.t,w); if(typeof r==='string') sh.rd.innerHTML=r;
      const c=w.cam; camera.position.set(c.r*Math.cos(c.phi)*Math.sin(c.theta),c.r*Math.sin(c.phi),c.r*Math.cos(c.phi)*Math.cos(c.theta)); camera.lookAt(spec.target?new THREE.Vector3(...spec.target):new THREE.Vector3(0,0,0));
      renderer.render(scene,camera); }catch(e){ console.error('3d '+id,e); if(!root.querySelector('.w-err')){ const d=document.createElement('div'); d.className='w-err'; d.textContent='3D error: '+e.message; root.appendChild(d);} w.playing=false; } };
  if(spec.spin||spec.anim) { w.playing=spec.anim?w.playing:true; }
  const origPlaying=Object.getOwnPropertyDescriptor(w,'playing');
  w.themeChanged=()=>{ if(renderer){ dispose(); } w.dirty=true; };
  function dispose(){ if(renderer){ try{ scene.traverse(o=>{ o.geometry&&o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ m.map&&m.map.dispose(); m.dispose(); }); } }); renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); renderer.domElement.remove(); }catch(_){} renderer=null; st=null; } }
  w.destroy=()=>{ if(io) io.unobserve(root); ro&&ro.disconnect(); dispose(); };
  w.onHide=()=>{ };
  const ro=('ResizeObserver' in window)?new ResizeObserver(()=>{ w.dirty=true; kick(); }):null; ro&&ro.observe(sh.stage);
  root.__w=w; widgets.push(w); if(io) io.observe(root); else kick();
  return w;
};
function G3(THREE){
  const h={};
  h.label=function(text,color,scale){ const cv=document.createElement('canvas'); cv.width=256; cv.height=96; const c=cv.getContext('2d'); c.font='600 44px system-ui,sans-serif'; c.fillStyle=color; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,128,48);
    const tex=new THREE.CanvasTexture(cv); const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false})); const s=scale||1; sp.scale.set(2.6*s,0.975*s,1); return sp; };
  h.line=function(pts,color,opacity){ const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>p.isVector3?p:new THREE.Vector3(p[0],p[1],p[2]))); return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity!=null,opacity:opacity==null?1:opacity})); };
  h.tube=function(pts,color,radius){ const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]))); return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,pts.length*2),radius||0.03,8,false),new THREE.MeshBasicMaterial({color})); };
  h.arrow=function(from,to,color,headLen,headW){ const f=new THREE.Vector3(...from), t=new THREE.Vector3(...to); const d=t.clone().sub(f); const L=d.length(); return new THREE.ArrowHelper(d.normalize(),f,L,color,headLen||0.2,headW||0.1); };
  h.sphere=function(pos,color,r){ const m=new THREE.Mesh(new THREE.SphereGeometry(r||0.1,16,12),new THREE.MeshBasicMaterial({color})); m.position.set(...pos); return m; };
  h.axes=function(L,labels,C){ const g=new THREE.Group(); const cs=[C.red,C.green,C.blue]; const dirs=[[1,0,0],[0,1,0],[0,0,1]];
    dirs.forEach((d,i)=>{ g.add(h.line([[-d[0]*L,-d[1]*L,-d[2]*L],[d[0]*L,d[1]*L,d[2]*L]],cs[i],0.55)); if(labels&&labels[i]){ const s=h.label(labels[i],cs[i],0.7); s.position.set(d[0]*(L+0.35),d[1]*(L+0.35),d[2]*(L+0.35)); g.add(s);} }); return g; };
  /* surface z=y(x,z) over [x0,x1]x[z0,z1]; fn(x,z)->height; colorFn(height)->THREE.Color */
  h.surface=function(fn,x0,x1,z0,z1,nx,nz,colorFn,wire){ const geo=new THREE.BufferGeometry(); const pos=new Float32Array((nx+1)*(nz+1)*3), colr=new Float32Array((nx+1)*(nz+1)*3), idx=[];
    for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){ const k=(i*(nz+1)+j)*3; const x=x0+(x1-x0)*i/nx, z=z0+(z1-z0)*j/nz, y=fn(x,z); pos[k]=x;pos[k+1]=y;pos[k+2]=z; const c=colorFn?colorFn(y):new THREE.Color(0x58c4dd); colr[k]=c.r;colr[k+1]=c.g;colr[k+2]=c.b; }
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){ const a=i*(nz+1)+j,b=a+1,c=a+nz+1,d=c+1; idx.push(a,b,c,b,d,c); }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(colr,3)); geo.setIndex(idx); geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:0.88}));
    const grp=new THREE.Group(); grp.add(mesh); if(wire!==false){ const wf=new THREE.LineSegments(new THREE.WireframeGeometry(geo),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.12})); grp.add(wf);} grp.userData.geo=geo; grp.userData.nx=nx; grp.userData.nz=nz; return grp; };
  h.updateSurface=function(grp,fn,x0,x1,z0,z1,colorFn){ const geo=grp.userData.geo, nx=grp.userData.nx, nz=grp.userData.nz, pos=geo.attributes.position.array, colr=geo.attributes.color.array;
    for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){ const k=(i*(nz+1)+j)*3; const x=x0+(x1-x0)*i/nx, z=z0+(z1-z0)*j/nz, y=fn(x,z); pos[k+1]=y; if(colorFn){ const c=colorFn(y); colr[k]=c.r;colr[k+1]=c.g;colr[k+2]=c.b; } }
    geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals(); };
  return h;
}

/* ================= SVG block diagrams ================= */
GB.diagram = function(id,spec){
  const root=document.getElementById(id); if(!root) return; const cap=root.innerHTML; root.innerHTML=''; root.classList.add('dia');
  const W=spec.w||720,Hh=spec.h||160,C=n=>n&&n[0]!=='#'?'var(--'+n+')':(n||'var(--fg)'); const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 '+W+' '+Hh); svg.setAttribute('role','img'); if(spec.alt) svg.setAttribute('aria-label',spec.alt);
  const add=(tag,at,txt)=>{ const e=document.createElementNS(NS,tag); for(const k in at) e.setAttribute(k,at[k]); if(txt!=null) e.textContent=txt; svg.appendChild(e); return e; };
  const label=(x,y,s,cls,anchor,fill)=>{ label_(x,y,s,cls,anchor,fill); }; const label_=(x,y,s,cls,anchor,fill)=>{ String(s).split('\n').forEach((ln,i,arr)=>{ const e=add('text',{x:x,y:y+(i-(arr.length-1)/2)*15,'text-anchor':anchor||'middle','dominant-baseline':'central',class:cls||'t'},ln); if(fill) e.style.fill=fill; }); };
  (spec.items||[]).forEach(it=>{ const t=it[0];
    if(t==='box'){ const [_,x,y,w,h,s,c]=it; add('rect',{x,y,width:w,height:h,rx:8,class:'bx',style:'stroke:'+C(c||'axis')}); label(x+w/2,y+h/2,s,'tb'); }
    else if(t==='sum'){ const [_,x,y,r,s,c]=it; add('circle',{cx:x,cy:y,r:r,class:'bx',style:'stroke:'+C(c||'axis')}); label(x,y,s,'tb'); }
    else if(t==='arr'||t==='ln'){ const pts=it[1]; let label=null,color=null,dash=false;
      if(t==='arr'){ label=it[2]; color=it[3]; dash=!!it[4]; } else { color=it[2]; dash=!!it[3]; }
      const col_=C(color); const d=pts.map((v,i)=>(i%2?'':(i?'L':'M'))+v+(i%2?' ':',')).join('');
      add('path',{d:d,class:'ar',style:'stroke:'+col_+(dash?';stroke-dasharray:5 4':'')});
      if(t==='arr'){ const n=pts.length, x2=pts[n-2], y2=pts[n-1], x1=pts[n-4], y1=pts[n-3], a=Math.atan2(y2-y1,x2-x1), hh=9; add('path',{d:'M'+x2+','+y2+' L'+(x2-hh*Math.cos(a-0.4))+','+(y2-hh*Math.sin(a-0.4))+' L'+(x2-hh*Math.cos(a+0.4))+','+(y2-hh*Math.sin(a+0.4))+' Z',style:'fill:'+col_+';stroke:none'}); }
      if(t==='arr'&&label){ const vert=Math.abs(pts[2]-pts[0])<Math.abs(pts[3]-pts[1]); const mx=(pts[0]+pts[2])/2, my=(pts[1]+pts[3])/2; if(vert) label_(mx+8,my,label,'tm','start'); else label_(mx,my-10,label,'tm'); } }
    else if(t==='txt'){ const [_,x,y,s,cls,anchor,c]=it; label(x,y,s,cls||'t',anchor,c&&C(c)); }
    else if(t==='wave'){ /* small sine-ish icon: ['wave',x,y,w,h,'sin'|'sq'|'tri'|'pulse',color] */ const [_,x,y,w,h,k,c]=it; let d=''; for(let i=0;i<=40;i++){ const u=i/40, v=k==='sq'?(Math.sin(TAU*2*u)>=0?1:-1):k==='tri'?(2/Math.PI)*Math.asin(Math.sin(TAU*2*u)):k==='pulse'?(u>0.3&&u<0.5?1:0):Math.sin(TAU*2*u); d+=(i?'L':'M')+(x+w*u)+','+(y-h/2*v)+' '; } add('path',{d,style:'fill:none;stroke:'+C(c||'blue')+';stroke-width:1.8'}); }
  });
  const fig=document.createElement('div'); fig.appendChild(svg); root.appendChild(svg); if(cap.trim()){ const f=document.createElement('figcaption'); f.innerHTML=cap; root.appendChild(f); }
};

/* ================= problems ================= */
function ls(){ try{ return JSON.parse(localStorage.getItem('gb.prog')||'{}'); }catch(e){ return {}; } }
function lsSet(o){ try{ localStorage.setItem('gb.prog',JSON.stringify(o)); }catch(e){} }
GB.progress = ls;
GB.initProblems = function(root,chId){
  const probs=root.querySelectorAll('.prob'); const prog=ls(); let n=0;
  const scoreEl=root.querySelector('.score');
  function upd(){ const pr=ls(); let ok=0,tot=0; root.querySelectorAll('.prob').forEach(p=>{ tot++; if(pr[p.dataset.id]===1) ok++; }); if(scoreEl) scoreEl.innerHTML='Practice in this chapter: <b>'+ok+' / '+tot+'</b> answered correctly'; document.dispatchEvent(new CustomEvent('gb-prog')); }
  probs.forEach(p=>{ n++; const id=chId+'-p'+n; p.dataset.id=id; const type=p.dataset.type||'mcq', ans=String(p.dataset.ans||'').trim(), marks=p.dataset.marks, src=p.dataset.src;
    const q=document.createElement('div'); q.className='q'; const opts=p.querySelector('ol.opts'), sol=p.querySelector('.sol');
    while(p.firstChild&&p.firstChild!==opts&&p.firstChild!==sol){ q.appendChild(p.firstChild); }
    const ph=document.createElement('div'); ph.className='ph'; ph.innerHTML='Problem '+n+' <span class="kind">'+type.toUpperCase()+(marks?' · '+marks+' mark'+(marks>1?'s':''):'')+'</span>'+(src?'<span class="src">'+src+'</span>':''); p.prepend(q); p.prepend(ph);
    const fb=document.createElement('div'); fb.className='fb';
    let details=null; if(sol){ details=document.createElement('details'); details.className='sol'; details.innerHTML='<summary>Show solution</summary><div class="body">'+sol.innerHTML+'</div>'; sol.replaceWith(details); }
    const mark=(ok)=>{ const pr=ls(); if(pr[id]!==1) pr[id]=ok?1:0; lsSet(pr); fb.className='fb '+(ok?'ok':'bad'); fb.textContent=ok?'✓ Correct':'✗ Not quite — study the solution below'; if(!ok&&details) details.open=true; upd(); };
    if(opts&&(type==='mcq'||type==='msq')){ const lis=[...opts.children], letters='ABCDEFGH'; const correct=ans.split(',').map(s=>s.trim().toUpperCase()); const btns=[];
      lis.forEach((li,i)=>{ const b=document.createElement('button'); b.innerHTML='<span class="L">'+letters[i]+'</span><span>'+li.innerHTML+'</span>'; li.innerHTML=''; li.appendChild(b); btns.push(b);
        b.onclick=()=>{ if(type==='mcq'){ btns.forEach(x=>x.classList.remove('sel','ok','bad')); const ok=correct.includes(letters[i]); b.classList.add(ok?'ok':'bad'); if(!ok){ btns.forEach((x,j)=>{ if(correct.includes(letters[j])) x.classList.add('ok'); }); } mark(ok); } else { b.classList.toggle('sel'); } }; });
      if(type==='msq'){ const c=document.createElement('button'); c.className='chk'; c.textContent='Check'; c.onclick=()=>{ const sel=btns.map((b,i)=>b.classList.contains('sel')?letters[i]:null).filter(Boolean); const ok=sel.length===correct.length&&sel.every(s=>correct.includes(s)); btns.forEach((b,i)=>{ b.classList.remove('ok','bad'); if(correct.includes(letters[i])) b.classList.add('ok'); else if(b.classList.contains('sel')) b.classList.add('bad'); }); mark(ok); }; p.insertBefore(c,details); } }
    else if(type==='nat'){ const wrap=document.createElement('div'); wrap.className='nat'; const inp=document.createElement('input'); inp.type='text'; inp.inputMode='decimal'; inp.placeholder='Your numerical answer'; const b=document.createElement('button'); b.className='chk'; b.textContent='Check'; wrap.appendChild(inp); wrap.appendChild(b); p.insertBefore(wrap,details);
      const tol=p.dataset.tol!=null?+p.dataset.tol:Math.max(1e-9,Math.abs(+ans)*0.01); const go=()=>{ const v=parseFloat(inp.value.replace(',','.')); if(isNaN(v)){ fb.className='fb bad'; fb.textContent='Enter a number'; return; } const ok=Math.abs(v-parseFloat(ans))<=tol; mark(ok); if(!ok) fb.textContent+='  (accepted: '+ans+(tol?' ± '+(+tol.toPrecision(2)):'')+')'; }; b.onclick=go; inp.onkeydown=e=>{ if(e.key==='Enter') go(); }; }
    p.insertBefore(fb,details);
    if(prog[id]===1){ fb.className='fb ok'; fb.textContent='✓ Solved earlier'; }
  });
  upd();
};
})();
