import sys,os
sys.path.insert(0,'/home/akshay/notes/gate-communication/book/tools/pylib')
import pymupdf, numpy as np
from rapidocr_onnxruntime import RapidOCR
eng=RapidOCR()
for y in sys.argv[1:]:
    d=pymupdf.open(f'raw/ec{y}.pdf'); out=[]
    for i,p in enumerate(d):
        pix=p.get_pixmap(dpi=130); img=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.h,pix.w,pix.n)[:,:,:3]
        res,_=eng(img)
        lines=[]
        if res:
            # sort by y then x, group lines
            res=sorted(res,key=lambda r:(round(r[0][0][1]/14),r[0][0][0]))
            cur=None;buf=[]
            for r in res:
                yy=round(r[0][0][1]/14)
                if cur is None or yy==cur: buf.append(r[1])
                else: lines.append(' '.join(buf)); buf=[r[1]]
                cur=yy
            if buf: lines.append(' '.join(buf))
        out.append(f'=====PAGE {i+1}=====\n'+'\n'.join(lines))
        print(y,i+1,flush=True)
    open(f'txt/ec{y}_ocr.txt','w').write('\n'.join(out))
