import re,sys
from split import *
H=eval(sys.argv[1])
for y,hs in H.items():
    q=split(open(f'txt/ec{y}.txt').read()); k=keys(open(f'txt/key{y}.txt').read())
    for n in hs:
        b=re.sub(r'\s*\n\s*',' ⏎ ',q[n])
        print(f'--- {y} Q{n} key={k[n]}\n{b[:1000]}')
