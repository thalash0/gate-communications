/* App shell: chapter routing, sidebar, theme, font size, progress. Data injected by build.mjs:
   window.GB_CHAPTERS = [{id,num,title,part,lede,sections:[{id,title}],probs}], <template id="t-{id}">, window.GB_INIT[id] */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const store={ get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
const CH=window.GB_CHAPTERS, byId={}; CH.forEach((c,i)=>{ c.i=i; byId[c.id]=c; });
let cur=null;

/* ---- theme & font ---- */
function applyTheme(t){ document.documentElement.setAttribute('data-theme',t); store.set('gb.theme',t); const b=$('#btn-theme'); if(b) b.textContent=t==='dark'?'☀':'☾'; document.dispatchEvent(new Event('gb-theme')); }
applyTheme(store.get('gb.theme','dark'));
let fs=+store.get('gb.fs',18); function applyFs(){ document.documentElement.style.setProperty('--fs',fs+'px'); store.set('gb.fs',fs); document.dispatchEvent(new Event('gb-theme')); }
applyFs();

/* ---- sidebar ---- */
function buildSide(){
  const side=$('#side'); let html='', part='';
  CH.forEach(c=>{ if(c.part!==part){ part=c.part; html+='<div class="part">'+part+'</div>'; }
    html+='<a class="ch" href="#'+c.id+'" data-id="'+c.id+'"><span class="n">'+c.num+'</span><span>'+c.title+'</span><span class="pg" data-pg="'+c.id+'"></span></a><div class="secs" data-secs="'+c.id+'" hidden></div>'; });
  side.innerHTML=html; refreshProg();
  side.addEventListener('click',e=>{ if(e.target.closest('a')&&window.innerWidth<=980) document.body.classList.remove('sideopen'); });
}
function refreshProg(){ const pr=GB.progress(); CH.forEach(c=>{ if(!c.probs) return; let ok=0; for(let i=1;i<=c.probs;i++) if(pr[c.id+'-p'+i]===1) ok++; const el=document.querySelector('[data-pg="'+c.id+'"]'); if(el) el.textContent=ok+'/'+c.probs; }); }
document.addEventListener('gb-prog',refreshProg);

/* ---- routing ---- */
function show(id,sec,keepScroll){
  const c=byId[id]||CH[0]; if(!c) return; cur=c; store.set('gb.last',c.id);
  GB.reset(); const host=$('#chapter'); host.innerHTML='';
  const tpl=document.getElementById('t-'+c.id); host.appendChild(tpl.content.cloneNode(true));
  document.title=c.num+'. '+c.title+' — Signals in the Wild';
  $('#topbar .ttl').textContent=(c.num?c.num+' · ':'')+c.title;
  document.querySelectorAll('#side a.ch').forEach(a=>a.classList.toggle('on',a.dataset.id===c.id));
  document.querySelectorAll('.secs').forEach(s=>{ s.hidden=s.dataset.secs!==c.id; });
  const secs=document.querySelector('.secs[data-secs="'+c.id+'"]'); if(secs&&!secs.innerHTML) secs.innerHTML=c.sections.map(s=>'<a href="#'+c.id+':'+s.id+'">'+s.title+'</a>').join('');
  // pager
  const p=document.createElement('div'); p.className='pager'; const pv=CH[c.i-1], nx=CH[c.i+1];
  p.innerHTML=(pv?'<a href="#'+pv.id+'"><small>← Previous</small>'+pv.num+' '+pv.title+'</a>':'<span style="flex:1"></span>')+(nx?'<a class="next" href="#'+nx.id+'"><small>Next →</small>'+nx.num+' '+nx.title+'</a>':'<span style="flex:1"></span>');
  host.appendChild(p);
  if(window.GB_INIT&&GB_INIT[c.id]) GB_INIT[c.id](host);
  GB.initProblems(host,c.id);
  if(sec){ const el=document.getElementById(sec); if(el) setTimeout(()=>el.scrollIntoView({behavior:'auto',block:'start'}),30); else window.scrollTo(0,0); }
  else if(!keepScroll) window.scrollTo(0,0);
}
function route(){ const h=location.hash.slice(1); if(!h){ show(store.get('gb.last',CH[0].id)); return; } const [id,sec]=h.split(':'); if(cur&&cur.id===id&&sec){ const el=document.getElementById(sec); if(el){ el.scrollIntoView({behavior:'smooth',block:'start'}); return; } } show(id,sec); }
window.addEventListener('hashchange',route);

/* ---- progress bar ---- */
window.addEventListener('scroll',()=>{ const h=document.documentElement; const p=h.scrollTop/(h.scrollHeight-h.clientHeight||1); $('#progress').style.width=(Math.min(1,p)*100)+'%'; },{passive:true});

/* ---- boot ---- */
document.addEventListener('DOMContentLoaded',()=>{
  buildSide(); applyTheme(document.documentElement.getAttribute('data-theme'));
  $('#btn-theme').onclick=()=>applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
  $('#btn-menu').onclick=()=>{ if(window.innerWidth<=980) document.body.classList.toggle('sideopen'); else document.body.classList.toggle('noside'); };
  $('#btn-fs-up').onclick=()=>{ fs=Math.min(26,fs+1); applyFs(); }; $('#btn-fs-dn').onclick=()=>{ fs=Math.max(14,fs-1); applyFs(); };
  document.addEventListener('click',e=>{ if(window.innerWidth<=980&&document.body.classList.contains('sideopen')&&!e.target.closest('#side')&&!e.target.closest('#btn-menu')) document.body.classList.remove('sideopen'); });
  route();
});
})();
