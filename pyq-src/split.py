import re, sys, json
KW = r"modulat|\bAM\b|\bFM\b|\bPM\b|\bSSB\b|DSB|carrier|autocorrelation|power spectral|\bPSD\b|white noise|random process|wide.sense|stationary|entropy|mutual information|channel capacity|Shannon|\bBER\b|bit error|\bPCM\b|quantiz|DPCM|matched filter|Hamming|\bCRC\b|parity|QPSK|\bBPSK\b|\bPSK\b|\bFSK\b|\bASK\b|\bQAM\b|constellation|superheterodyne|intermediate frequency|image frequency|bits/s|bit rate|noise figure|thermal noise|Huffman|codeword|code word|generator matrix|syndrome|inter.?symbol|raised cosine|ML detect|MAP |likelihood|Eb/N0|erfc|delta modulation|envelope detector|Bessel|frequency deviation|Carson|binary symmetric|erasure|pre-emphasis|de-emphasis|noise power|AWGN|transmitted symbol|received symbol|decision|threshold detector|baseband|bandpass|sidebands?|autocovariance|correlation function|Wiener|Poisson|ergodic"

def split(txt):
    ms = list(re.finditer(r'(?m)^[ \t]*Q\.[ ]?(\d+)(?![ \d]*[–-])[ \t]*', txt))
    out = {}
    for a, b in zip(ms, ms[1:] + [None]):
        body = txt[a.end():(b.start() if b else len(txt))]
        body = re.sub(r'=====PAGE \d+=====', '', body)
        body = re.sub(r'(?m)^.*(Organizing Institute|Electronics and Communication Engineering \(EC\)|^\s*Page \d+( of \d+)?\s*$).*$', '', body)
        body = re.sub(r'(?m)^\s*Q\.\s?\d+\s*[–-]\s*Q\.\s?\d+.*$', '', body)
        n = int(a.group(1))
        if n not in out:
            out[n] = re.sub(r'\n\s*\n+', '\n', body).strip()
    return out

def keys(txt):
    t = [x.strip() for x in txt.split('\n') if x.strip()]
    i = t.index('Mark') if 'Mark' in t else 5
    rows = t[i + 1:]
    res = {}; j = 0
    while j < len(rows):
        if rows[j].isdigit():
            n = int(rows[j]); k = j + 1; blk = []
            while k < len(rows) and not (rows[k].isdigit() and int(rows[k]) == n + 1 and len(blk) >= 4):
                blk.append(rows[k]); k += 1
            res[n] = blk; j = k
        else:
            j += 1
    return res

if __name__ == '__main__':
    for y in [2022, 2023, 2024, 2025, 2026]:
        q = split(open(f'txt/ec{y}.txt').read()); k = keys(open(f'txt/key{y}.txt').read())
        hits = [n for n, b in q.items() if n > 10 and re.search(KW, b, re.I)]
        print(y, len(q), len(k), 'comm-ish hits:', len(hits), hits)
