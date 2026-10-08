import re
def rd(n): return open(f'src/chapters/{n}','r',encoding='utf8').read()
def wr(n,s): open(f'src/chapters/{n}','w',encoding='utf8').write(s)
def before(s,marker,new,count=1):
    i=s.index(marker); return s[:i]+new+s[i:]
SRC='GATE {y} · EC (PYQ book)'
def P(kind,ans,marks,src,q,sol,tol=None,opts=None):
    t=f' data-tol="{tol}"' if tol is not None else ''
    o=''
    if opts: o='<ol class="opts">'+''.join(f'<li>{x}</li>' for x in opts)+'</ol>'
    return f'<div class="prob" data-type="{kind}" data-ans="{ans}"{t} data-marks="{marks}" data-src="{src}">\n{q}\n{o}<div class="sol"><p>{sol}</p></div></div>\n\n'

# ---- ch01
s=rd('01-probability.html')
add=P('nat','6',1,'GATE 2015 · EC (PYQ book)',r'Let $X$ be the number of tosses of a fair coin needed until two consecutive heads appear for the first time. $\E[X]$ is ______.',r'Let $E_0$ be the expected number of further tosses when the last toss was not a head (or at the start) and $E_1$ when the last toss was a head. $E_0=1+\tfrac12E_1+\tfrac12E_0$ and $E_1=1+\tfrac12\cdot0+\tfrac12E_0$. Substituting, $E_0=1+\tfrac12(1+\tfrac12E_0)+\tfrac12E_0=1.5+\tfrac34E_0$, so $E_0=\mathbf6$.',0.05)
add+=P('nat','0.4',2,'GATE 2015 · EC (PYQ book)',r'A binary symmetric channel has crossover probability $1/7$. The input is 1 with probability 0.8 and 0 with probability 0.2. Given that the received bit is $Y=0$, the probability that a 1 was transmitted is ______.',r'$P(Y=0)=0.2\cdot\frac67+0.8\cdot\frac17=\frac{2.0}{7}$. $P(X=1\mid Y=0)=\dfrac{0.8/7}{2.0/7}=\mathbf{0.4}$. A prior of 0.8 for a 1 becomes only 0.4 after seeing a 0: Bayes in action (cf. the probability square at the start of the chapter).',0.01)
s=before(s,'<div class="summary">',add); wr('01-probability.html',s)

# ---- ch02
s=rd('02-fourier.html')
add=P('nat','8',2,'GATE 2018 · EC (PYQ book)',r'The signal $4\,\sinc(2t)$ is applied to a Hilbert transformer, giving $y(t)$. Here $\sinc(x)=\sin(\pi x)/(\pi x)$. The value of $\int_{-\infty}^{\infty}y^2(t)\,dt$ is ______.',r'The Hilbert transformer has $|H(f)|=1$ for all $f\ne0$: it changes phases but not magnitudes, so <b>it preserves energy</b>. $x(t)=4\sinc(2t)\leftrightarrow X(f)=2\rect(f/2)$, energy $=\int_{-1}^{1}2^2df=\mathbf8$.',0.05)
add+=P('mcq','C',1,'GATE 2015 · EC (PYQ book)',r'Let $m(t)$ have bandwidth much smaller than $f_c$ and let $\hat m(t)$ be its Hilbert transform. The signal $s(t)=m(t)\cos2\pi f_ct+\hat m(t)\sin2\pi f_ct$ is a',r'$m\cos\omega_ct+\hat m\sin\omega_ct$ is exactly the lower-sideband SSB signal of Chapter 4: all its energy lies in a band just below $f_c$. A signal concentrated around $f_c\gg W$ is a band-pass signal. <b>(C)</b>.',None,['high-pass signal','low-pass signal','band-pass signal','notch (band-stop) signal'])
s=before(s,'<div class="summary">',add); wr('02-fourier.html',s)

# ---- ch03 teaching + problems
s=rd('03-random-processes.html')
teach=r'''<h3>Symbols with memory: the PSD of a correlated pulse train</h3>
<p>Chapter 9 will need this. Suppose the pulse amplitudes $b_n$ are <em>not</em> independent but have autocorrelation $R_b[m]=\E[b_nb_{n-m}]$. A pulse train $X(t)=\sum_nb_n\,g(t-nT)$ (made stationary with a random delay) has
$$S_X(f)=\frac{|G(f)|^2}{T}\;\underbrace{\sum_{m=-\infty}^{\infty}R_b[m]\,e^{-j2\pi fmT}}_{S_b(f)}.$$
The first factor is the pulse's own spectrum, the second the "spectrum of the symbol sequence". For independent $\pm1$ symbols $R_b[m]=\delta_m$ and $S_b=1$, recovering $|G|^2/T$. Correlation sculpts the spectrum. Example: $b_n=\alpha_n+k\,\alpha_{n-3}$ with $\alpha_n=\pm1$ independent. Then $R_b[0]=1+k^2$, $R_b[\pm3]=k$, others 0, so $S_b(f)=1+k^2+2k\cos(2\pi f\cdot3T)$. At $f=\frac1{3T}$ the cosine is $1$ and $S_b=(1+k)^2$: a <b>spectral null at $f=1/3T$ requires $k=-1$</b> (this is GATE 2016's question). Line codes like AMI and duobinary are exactly this idea: choose the correlation so that the nulls fall where you want (at DC for AMI).</p>
'''
s=before(s,'<h2>White noise</h2>',teach)
add=P('nat','100',2,'GATE 2016 · EC (PYQ book)',r'$X(t)=3V(t)-8$, where $V(t)$ is a zero-mean stationary random process with autocorrelation $R_V(\tau)=4e^{-5|\tau|}$. The power in $X(t)$ is ______.',r'Power $=\E[X^2]=9\E[V^2]-48\E[V]+64=9\cdot R_V(0)+64=36+64=\mathbf{100}$. The constant $-8$ is a <em>DC</em> term with power 64: the variance alone (36) would be the wrong answer.',0.5)
add+=P('nat','0.5',1,'GATE 2015 · EC (PYQ book, adapted)',r'$\{X_n\}$ is i.i.d. with $X_n=\pm1$ equally likely, and $Y_n=X_n+0.5X_{n-1}$. The autocorrelation $R_Y[1]=\E[Y_nY_{n-1}]$ is ______.',r'$\E[(X_n+0.5X_{n-1})(X_{n-1}+0.5X_{n-2})]=0.5\E[X_{n-1}^2]=0.5$ (all other cross terms vanish). Also $R_Y[0]=1+0.25=1.25$ and $R_Y[m]=0$ for $|m|\ge2$.',0.01)
add+=P('nat','-1',2,'GATE 2016 · EC (PYQ book)',r'Independent equiprobable symbols $\alpha_n=\pm1$ are precoded as $\beta_n=\alpha_n+k\,\alpha_{n-3}$ and used to amplitude-modulate a rectangular pulse $g(t)=1$ for $0\le t\le T$: $X(t)=\sum\beta_ng(t-nT)$. If the PSD of $X(t)$ has a null at $f=\frac1{3T}$, then $k$ is ______.',r'$S_X(f)=\frac{|G(f)|^2}T[1+k^2+2k\cos(6\pi fT)]$. At $f=\frac1{3T}$: $\cos(2\pi)=1$ so the bracket is $(1+k)^2$, zero only if $k=-1$. ($|G|^2$ itself has nulls at multiples of $1/T$, not at $1/3T$.)',0.01)
s=before(s,'<div class="summary">',add); wr('03-random-processes.html',s)

# ---- ch04
s=rd('04-am.html')
add=P('nat','0.5',1,'GATE 2016 · EC (PYQ book)',r'A sinusoidal carrier is amplitude-modulated by a single sinusoid giving $S(t)=5\cos1600\pi t+20\cos1800\pi t+5\cos2000\pi t$. The modulation index is ______.',r'Carrier amplitude 20 (at 900 Hz), sidebands 5 each (at 800 and 1000 Hz): each sideband is $\mu A_c/2$, so $\mu=\frac{2\cdot5}{20}=\mathbf{0.5}$.',0.01)
add+=P('nat','0.125',1,'GATE 2018 · EC (PYQ book)',r'Consider the AM signal $S(t)=\cos2000\pi t+4\cos2400\pi t+\cos2800\pi t$. The ratio (three decimals) of the power in the sidebands (message-carrying part) to the carrier power is ______.',r'Carrier: $4\cos2400\pi t$, $P_c=\frac{16}2=8$. Sidebands: two terms of amplitude 1, total $2\cdot\frac12=1$. Ratio $=\frac18=\mathbf{0.125}$ (equal to $\mu^2/2$ with $\mu=\frac12$).',0.005)
add+=P('nat','5.21',2,'GATE 2017 · EC (PYQ book, reworded)',r'An AM transmitter has an unmodulated carrier power of 5 kW and can be modulated by a sinusoid up to a maximum of 50%. If the maximum modulation is reduced to 40% without overloading the transmitter (same maximum total power), the maximum unmodulated carrier power (kW) that can be used is ______.',r'Total power limit $=5(1+0.5^2/2)=5.625$ kW. With $\mu=0.4$: $P_c(1+0.08)=5.625\Rightarrow P_c=\mathbf{5.21}$ kW.',0.03)
add+=P('mcq','D',2,'GATE 2018 · EC (PYQ book)',r'$v_i(t)=A_c\cos2\pi f_ct+\cos2\pi f_mt$ ($f_c\gg5f_m$) is applied to a non-linear device $v_o=a\,v_i+b\,v_i^2$ ($a,b>0$) followed by an ideal band-pass filter centred at $f_c$ with bandwidth $3f_m$, producing an AM wave. For the sideband power to be half the carrier power, $a/b$ must be',r'The product term of $bv_i^2$ is $2bA_c\cos2\pi f_ct\cos2\pi f_mt=bA_c[\cos2\pi(f_c+f_m)t+\cos2\pi(f_c-f_m)t]$: two sidebands of amplitude $bA_c$, total power $(bA_c)^2$. The carrier has amplitude $aA_c$, power $(aA_c)^2/2$. Condition: $(bA_c)^2=\frac12\cdot\frac{(aA_c)^2}2\Rightarrow a=2b$. <b>(D)</b>.',None,['0.25','0.5','1','2'])
s=before(s,'<div class="summary">',add); wr('04-am.html',s)

# ---- ch05
s=rd('05-fm.html')
teach=r'''<h2>PLL as a frequency synthesizer</h2>
<p>The same PLL, used backwards, makes the clocks and carriers of every digital device. Put a <b>divide-by-$N$ counter</b> in the feedback path from the VCO to the phase detector. The loop locks when the divided VCO frequency equals the reference: $f_{VCO}/N=f_{ref}$, so
$$f_{out}=N\,f_{ref}.$$
A single crystal reference (very stable, but fixed) thereby yields a whole comb of frequencies, selected by changing $N$. This is how your radio tunes to 94.3 MHz and how a Wi-Fi chip makes 2.4 GHz from a 40 MHz crystal. (GATE 2016: a 5 kHz reference with ÷2, ÷4, ÷8, ÷16 taps in the feedback path gives outputs of 10, 20, 40, 80 kHz.)</p>
<div id="d-synth" class="dia">Frequency synthesizer: the loop forces $f_{out}/N=f_{ref}$.</div>
'''
s=before(s,'<h2>Stereo and pre-emphasis: two engineering touches</h2>',teach)
s=s.replace("/* ---------- PM vs FM ---------- */","GB.diagram('d-synth',{w:700,h:130,items:[['txt',10,40,'f_ref','tb','start'],['arr',[44,40,86,40]],['box',86,18,100,44,'Phase\\ndetector','blue'],['arr',[186,40,220,40]],['box',220,18,90,44,'Loop filter','purple'],['arr',[310,40,350,40]],['box',350,18,80,44,'VCO','orange'],['arr',[430,40,520,40]],['txt',530,40,'f_out = N f_ref','tb','start'],['ln',[470,40,470,100,136,100],'mute'],['box',250,82,100,36,'÷ N','red'],['arr',[136,100,136,62]]]});\n/* ---------- PM vs FM ---------- */",1)
add=P('mcq','A',1,'GATE 2016 · EC (PYQ book)',r'A frequency synthesizer has a PLL whose feedback path contains a divide-by-$N$ counter with selectable $N=2,4,8,16$. It is excited by a 5 kHz reference. The synthesized frequencies for $N=2,4,8,16$ are',r'$f_{out}=Nf_{ref}$: $10,20,40,80$ kHz. <b>(A)</b>.',None,['10 kHz, 20 kHz, 40 kHz, 80 kHz','20 kHz, 30 kHz, 80 kHz, 160 kHz','80 kHz, 40 kHz, 20 kHz, 10 kHz','160 kHz, 80 kHz, 40 kHz, 20 kHz'])
add+=P('mcq','C',2,'GATE 2015 · EC (PYQ book)',r'A message $m(t)=A_m\sin2\pi f_mt$ phase-modulates a carrier: $y(t)=A_c\cos(2\pi f_ct+m(t))$. The bandwidth of $y(t)$',r'Here $\beta=k_pA_m=A_m$ and Carson gives $B=2f_m(\beta+1)=2f_m(A_m+1)$: it depends on <b>both</b> $A_m$ and $f_m$. (C).',None,['depends on $A_m$ but not on $f_m$','depends on $f_m$ but not on $A_m$','depends on both $A_m$ and $f_m$','does not depend on either'])
s=before(s,'<div class="summary">',add); wr('05-fm.html',s)

# ---- ch06
s=rd('06-superhet-noise.html')
add=P('nat','5',1,'GATE 2016 · EC (PYQ book)',r'A superheterodyne receiver (high-side injection, $f_{LO}=f_s+f_{IF}$) tunes the range 58–68 MHz. The minimum $f_{IF}$ (MHz) such that every image frequency falls outside the 58–68 MHz band is ______.',r'Image $=f_s+2f_{IF}$; the lowest tuned frequency $58$ MHz gives the lowest image $58+2f_{IF}$, which must exceed 68 MHz: $f_{IF}>5$ MHz. Minimum $=\mathbf5$ MHz. (A larger IF buys image rejection but costs IF selectivity.)',0.05)
add+=P('nat','3485',1,'GATE 2016 · EC (PYQ book)',r'A superheterodyne receiver has $f_{IF}=15$ MHz and $f_{LO}=3.5$ GHz. The received signal frequency is <em>greater</em> than the LO frequency. The image frequency (MHz) is ______.',r'Now $f_s=f_{LO}+f_{IF}=3515$ MHz (a high-side received signal: <b>low-side injection</b>). The image is on the other side of the LO: $f_{im}=f_{LO}-f_{IF}=f_s-2f_{IF}=\mathbf{3485}$ MHz. General rule: the image is the mirror of the wanted signal about the LO.',1)
s=before(s,'<div class="summary">',add); wr('06-superhet-noise.html',s)

# ---- ch07 teaching + problems
s=rd('07-information.html')
teach=r'''<h3>A zoo of channel types</h3>
<p>The two conditional entropies decide what a channel is. $H(X\mid Y)$ is the ambiguity left about the input after seeing the output ("equivocation"); $H(Y\mid X)$ is the output uncertainty caused by noise given the input.
<table>
<tr><th>Channel</th><th>Condition</th><th>Transition matrix</th><th>Capacity</th></tr>
<tr><td><b>Lossless</b></td><td>$H(X\mid Y)=0$: the input can be read off the output</td><td>each column has a single non-zero entry</td><td>$\log_2(\#\text{inputs})$</td></tr>
<tr><td><b>Deterministic</b></td><td>$H(Y\mid X)=0$: each input gives one definite output</td><td>each row has a single 1</td><td>$\log_2(\#\text{distinct outputs})$</td></tr>
<tr><td><b>Noiseless</b></td><td>both: lossless and deterministic</td><td>a permutation matrix</td><td>$\log_2K$ (e.g. the cyclic channel at $\alpha=1$)</td></tr>
<tr><td><b>Useless</b></td><td>$I(X;Y)=0$: output independent of input</td><td>all rows identical</td><td>0 (BSC with $p=\frac12$)</td></tr>
</table>
GATE 2017 showed a binary channel whose two rows were both $(0.25,\,0.75)$: identical rows ⇒ the output has the same distribution whatever is sent ⇒ <b>useless</b> (not noiseless, lossless or deterministic).</p>
'''
s=before(s,'<h2>Why a noisy channel can still carry bits perfectly',teach)
add=P('nat','31.5',2,'GATE 2016 · EC (PYQ book, reworded)',r'A voice-grade AWGN telephone channel has bandwidth 4.0 kHz and two-sided noise PSD $\eta/2=2.5\times10^{-5}$ W/Hz. Information is sent at 52 kbit/s with arbitrarily small error probability. The minimum bit energy $E_b$ (mJ/bit) required is ______.',r'$N_0=\eta=5\times10^{-5}$ W/Hz; noise power $N_0B=0.2$ W. Capacity condition $52\,000=4000\log_2(1+S/N)\Rightarrow S/N=2^{13}-1=8191$, so $S=8191\times0.2=1638$ W. $E_b=S/R_b=1638/52000=\mathbf{31.5}$ mJ/bit. (An absurd number for a real telephone line; the point is the method.)',0.2)
add+=P('mcq','C',1,'GATE 2017 · EC (PYQ book)',r'A binary memoryless channel has transition probabilities $P(0|0)=0.25,\ P(1|0)=0.75,\ P(0|1)=0.25,\ P(1|1)=0.75$. The channel is',r'Both rows are $(0.25,\ 0.75)$: the output distribution does not depend on the input, so $I(X;Y)=0$: <b>useless</b>.',None,['lossless','noiseless','useless','deterministic'])
add+=P('nat','1.75',1,'GATE 2016 · EC (PYQ book)',r'A discrete memoryless source has alphabet $\{a_1,a_2,a_3,a_4\}$ with probabilities $\{\frac12,\frac14,\frac18,\frac18\}$. The minimum required average code-word length in bits for error-free reconstruction is ______.',r'The minimum is the entropy: $\frac12(1)+\frac14(2)+2\cdot\frac18(3)=1.75$ bits (dyadic, so a Huffman code with lengths 1, 2, 3, 3 attains it).',0.01)
s=before(s,'<div class="summary">',add); wr('07-information.html',s)

# ---- ch09
s=rd('09-baseband.html')
add=P('nat','16',1,'GATE 2016 · EC (PYQ book)',r'A speech signal is sampled at 8 kHz and encoded with 8 bits per sample. The PCM bit stream is sent over a baseband channel using 4-level PAM. The minimum bandwidth (kHz) required is ______.',r'$R_b=64$ kbit/s; 4-level PAM carries 2 bits/symbol: $R_s=32$ ksym/s; Nyquist minimum bandwidth $R_s/2=\mathbf{16}$ kHz.',0.1)
add+=P('mcq','B',1,'GATE 2017 · EC (PYQ book, described)',r'Symbols are sent at 2000 symbols/s. The overall pulse spectrum $P(f)$ before the sampler is one of: (A) a unit rectangle of half-width 1.2 kHz with sharp corners but not symmetric in slope... [rect to 1.2 kHz]; (B) flat to 0.8 kHz and falling linearly to zero at 1.2 kHz, symmetric about $f=1$ kHz; (C) flat to 1 kHz then falling to zero at 1.2 kHz; (D) triangle. Which gives zero ISI?',r'Nyquist: $\sum_kP(f-kR_s)=$ const with $R_s=2$ kHz; the roll-off must be odd-symmetric about $R_s/2=1$ kHz. Only (B) (a trapezoid centred on the Nyquist frequency, i.e. a linear-roll-off Nyquist pulse) satisfies this; the shape (C) rolls off entirely above 1 kHz and leaves a dip where the shifted copies overlap.',None,['rectangle to 1.2 kHz','trapezoid: flat to 0.8 kHz, linear to 0 at 1.2 kHz','flat to 1 kHz, then linear to 0 at 1.2 kHz','triangle to 1.2 kHz'])
s=before(s,'<div class="summary">',add); wr('09-baseband.html',s)

# ---- ch10
s=rd('10-detection.html')
add=P('nat','-0.5',2,'GATE 2018 · EC (PYQ book)',r'$X\in\{-0.5,+0.5\}$ with probabilities $\frac14,\frac34$. The observation is $Y=X+Z$ with $Z$ uniform on $(-1,1)$, independent of $X$. The MAP detector outputs $\hat X=-0.5$ if $Y<\alpha$ and $+0.5$ if $Y\ge\alpha$. The value of $\alpha$ is ______.',r'If $X=-0.5$ then $Y\in(-1.5,0.5)$; if $X=+0.5$, $Y\in(-0.5,1.5)$. For $Y<-0.5$ only $X=-0.5$ is possible; for $Y>0.5$ only $+0.5$. In the overlap $(-0.5,0.5)$ the two likelihoods are equal ($\frac12$ each), so the priors decide: $\frac34>\frac14$ ⇒ choose $+0.5$. The decision switches at $\alpha=\mathbf{-0.5}$. (With uniform noise the MAP boundary sits at the edge of the overlap, not at the midpoint.)',0.01)
s=before(s,'<div class="summary">',add); wr('10-detection.html',s)

# ---- ch11
s=rd('11-digital-modulation.html')
add=P('nat','0.25',2,'GATE 2016 · EC (PYQ book)',r'An ideal band-pass channel occupies 500 Hz–2000 Hz. A modem sends 4800 bit/s using 16-QAM with raised-cosine pulses that exactly fill the band. The roll-off factor is ______.',r'$B=1500$ Hz $=(1+\alpha)R_s$ (passband), $R_s=4800/4=1200$ sym/s ⇒ $1+\alpha=1.25$, $\alpha=\mathbf{0.25}$.',0.01)
add+=P('nat','400',2,'GATE 2015 · EC (PYQ book)',r'A GSM carrier occupies 200 kHz and is shared by 8 users in TDMA. At a given time 12 users are talking in a cell. The minimum total bandwidth (kHz) of the signal received by the base station is ______.',r'One 200 kHz carrier supports 8 time slots. 12 users need $\lceil12/8\rceil=2$ carriers: $2\times200=\mathbf{400}$ kHz. (GSM modulation itself is GMSK: constant-envelope MSK with a Gaussian filter.)',1)
s=before(s,'<div class="summary">',add); wr('11-digital-modulation.html',s)

# ---- ch12
s=rd('12-coding.html')
add=P('nat','0.028',2,'GATE 2016 · EC (PYQ book)',r'A repetition code sends each bit three times (0→000, 1→111) over a BSC with crossover $p=0.1$. The decoder takes a majority vote. The average probability of error is ______.',r'Error iff at least 2 of 3 bits flip: $P_e=3p^2(1-p)+p^3=3(0.01)(0.9)+0.001=\mathbf{0.028}$. (Compare the uncoded $0.1$: a 3.6× improvement at a 3× bandwidth cost.)',0.001)
add+=P('nat','16',2,'GATE 2018 · EC (PYQ book)',r'A binary block code has fixed length 5 and the Hamming distance between any two distinct code words is at least 2. The maximum number of code words is ______.',r'The (5,4) single-parity-check code (all even-weight words) has $d_{\min}=2$ and $2^4=16$ words. No larger code exists: puncturing one coordinate leaves a code of length 4 with all words distinct (distance $\ge1$), so at most $2^4=16$ words. (The Singleton bound $2^{n-d+1}$ gives the same.)',0.01)
s=before(s,'<div class="summary">',add); wr('12-coding.html',s)
print('patched')
