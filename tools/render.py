#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# PD01 打印渲染器：文字 -> 384宽位图 -> bin
# 用法: python3 render.py <输出bin路径> <字号> <行高> <文字文件路径>
import sys
from PIL import Image, ImageDraw, ImageFont

FONT = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'
W = 384

def render(out_path, font_size, line_h, text):
    font = ImageFont.truetype(FONT, font_size)
    lines = text.split('\n')
    pad = 12
    H = pad*2 + line_h*len(lines)
    img = Image.new('L', (W, H), 255)
    d = ImageDraw.Draw(img)
    y = pad
    for ln in lines:
        d.text((pad, y), ln, font=font, fill=0)
        y += line_h
    H8 = ((H + 7)//8)*8
    if H8 != H:
        img2 = Image.new('L',(W,H8),255)
        img2.paste(img,(0,0))
        img = img2
    bw = img.convert('1')
    pix = bw.load()
    data = bytearray()
    for yy in range(H8):
        for xb in range(W//8):
            byte = 0
            for bit in range(8):
                if pix[xb*8+bit, yy] == 0:
                    byte |= (1<<bit)
            data.append(byte)
    open(out_path,'wb').write(bytes(data))
    return len(data), len(data)//48

if __name__ == '__main__':
    out = sys.argv[1]
    fs = int(sys.argv[2]) if len(sys.argv)>2 else 24
    lh = int(sys.argv[3]) if len(sys.argv)>3 else 32
    tf = sys.argv[4] if len(sys.argv)>4 else None
    if tf:
        text = open(tf, encoding='utf-8').read()
    else:
        text = sys.stdin.read()
    n, rows = render(out, fs, lh, text)
    print('OK bytes=%d rows=%d -> %s' % (n, rows, out))
