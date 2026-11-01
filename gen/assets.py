import os, json, math, random, wave, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
R='public/assets'
for d in ('','words','sounds','slider'): os.makedirs(f'{R}/{d}',exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'
INTER='/usr/share/fonts/opentype/inter/Inter-Black.otf'
rnd=random.Random(7)
def hexc(h): h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))

SLIDES=[ # id, word, bg, ring/color
 ('web','BUILDER','#fa8005','#fff1a2','#FFDC13'),
 ('graphic','DESIGNER','#50CBFF','#a8dcf0','#1b87b8'),
 ('photo','EDITOR','#FF7B5F','#ffd9c2','#9e2a12'),
 ('video','DIRECTOR','#2E3EAC','#d9d2f7','#919CFF'),
 ('ai','DREAMER','#b6fe00','#e4f7a8','#52AF16'),
 ('cs','LEARNER','#F7D000','#fff0b0','#8a6f00')]
# ---------- glyphs ----------
def glyph_img(ch,path,H=430):
    f=ImageFont.truetype(path,int(H*1.0))
    im=Image.new('L',(H*2,H*2),0);d=ImageDraw.Draw(im);d.text((H//2,H//2),ch,font=f,fill=255)
    bb=im.getbbox();im=im.crop(bb)
    pad=int(H*.04);out=Image.new('RGBA',(im.width+2*pad,im.height+2*pad),(255,255,255,0))
    out.putalpha(Image.new('L',out.size,0));a=Image.new('L',out.size,0);a.paste(im,(pad,pad));out=Image.new('RGBA',out.size,(255,255,255,255));out.putalpha(a)
    return out
def save_glyphs(word,dirp,prefix):
    res=[]
    for i,ch in enumerate(word):
        g=glyph_img(ch,FONT);name=f'{prefix}{i}.webp'
        # tall condensed look: stretch height
        g=g.resize((g.width,int(g.height*1.0)))
        g.save(f'{dirp}/{name}',quality=92)
        res.append([name,round(g.width/g.height*215,1),215])
    return res
G={'the':save_glyphs('THE',R,'middle-')}
for sid,word,*_ in SLIDES:
    os.makedirs(f'{R}/words/{sid}',exist_ok=True); G[sid]=save_glyphs(word,f'{R}/words/{sid}','')
json.dump(G,open('src/glyphs.json','w'))
# ---------- paper / cardboard ----------
def noise(w,h,base,amp,seed):
    r=np.random.RandomState(seed);n=r.rand(h//2+1,w//2+1)*2-1
    im=Image.fromarray(((n*127+128)).astype('uint8')).resize((w,h),Image.BICUBIC).filter(ImageFilter.GaussianBlur(.8))
    a=np.asarray(im).astype('float')/255-.5
    out=np.zeros((h,w,3))
    for i,c in enumerate(base): out[...,i]=c+a*amp
    return Image.fromarray(np.clip(out,0,255).astype('uint8'))
po=noise(1600,897,(255,255,255),60,1).convert('L');po=Image.merge('RGBA',(po,po,po,Image.new('L',po.size,255)));po.save(f'{R}/paper-overlay.webp',quality=70)
cb=noise(1400,900,(196,152,104),34,2);d=ImageDraw.Draw(cb)
for x in range(0,1400,14): d.line([(x,0),(x,900)],fill=(170,128,84),width=2)
cb=cb.filter(ImageFilter.GaussianBlur(.6));cb.save(f'{R}/cardboard.webp',quality=82)
# ---------- tape strips ----------
def strip(path,col,alpha,w=900,h=260,stripes=None,seed=0):
    r=random.Random(seed);im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im)
    pts=[(0,r.randint(0,10))];n=14
    top=[(x,r.randint(0,5)) for x in range(0,w+1,w//60)]
    bot=[(x,h-r.randint(0,5)) for x in range(w,-1,-w//60)]
    # zigzag ends
    left=[(r.randint(0,18),y) for y in range(h,-1,-h//10)]
    right=[(w-r.randint(0,18),y) for y in range(0,h+1,h//10)]
    poly=top+right+bot+left
    d.polygon(poly,fill=col+(alpha,))
    if stripes:
        for x in range(30,w,60): d.line([(x,10),(x,h-10)],fill=stripes+(60,),width=6)
    gl=Image.new('RGBA',(w,h),(255,255,255,0));g=ImageDraw.Draw(gl);g.rectangle((0,int(h*.12),w,int(h*.3)),fill=(255,255,255,50))
    im=Image.alpha_composite(im,Image.composite(gl,Image.new('RGBA',(w,h),(0,0,0,0)),im.split()[3]))
    im.save(path)
strip(f'{R}/tape-beige.png',(224,206,150),235,seed=1)
strip(f'{R}/tape-kraft.png',(214,170,120),240,seed=2,stripes=(180,135,90))
strip(f'{R}/tape-black.png',(40,40,44),245,seed=3,stripes=(70,70,75))
strip(f'{R}/tape-clear.png',(235,240,245),150,seed=4)
strip(f'{R}/tape-white.png',(246,246,242),235,seed=5)
# ---------- paper clip ----------
pc=Image.new('RGBA',(400,440),(0,0,0,0));d=ImageDraw.Draw(pc)
d.rounded_rectangle((80,30,300,400),radius=110,outline=(150,150,160,255),width=22)
d.rounded_rectangle((130,90,250,360),radius=60,outline=(150,150,160,255),width=22)
pc.save(f'{R}/paper-clip-1.webp',quality=90)
# ---------- ui icons ----------
def disc(path,col,sym):
    im=Image.new('RGBA',(300,300),(0,0,0,0));d=ImageDraw.Draw(im);d.ellipse((6,6,294,294),fill=col+(255,))
    f=ImageFont.truetype(INTER,150);bb=d.textbbox((0,0),sym,font=f);d.text((150-(bb[0]+bb[2])/2,150-(bb[1]+bb[3])/2),sym,font=f,fill=(255,255,255,255));im.save(path,quality=92)
disc(f'{R}/tape-sound-ball.webp',(34,97,233),'♪')
disc(f'{R}/mobile-slider-prev.webp',(34,97,233),'←');disc(f'{R}/mobile-slider-next.webp',(34,97,233),'→')
# rolls
for sid,word,bg,ring,ink in SLIDES:
    im=Image.new('RGBA',(400,400),(0,0,0,0));d=ImageDraw.Draw(im);c=hexc(ink)
    d.ellipse((10,10,390,390),fill=c+(255,));d.ellipse((90,90,310,310),fill=(250,245,230,255));d.ellipse((120,120,280,280),fill=hexc(bg)+(255,))
    d.arc((30,30,370,370),200,290,fill=(255,255,255,150),width=14)
    im.save(f'{R}/roll-{sid}.webp',quality=90)
# tag cards (stickers)
def tag(path,label,col,ink,rot=0):
    im=Image.new('RGBA',(640,640),(0,0,0,0));d=ImageDraw.Draw(im);d.rounded_rectangle((20,20,620,620),radius=90,fill=col+(255,))
    f=ImageFont.truetype(INTER,92);lines=label.split(' ');y=320-len(lines)*60
    for ln in lines:
        bb=d.textbbox((0,0),ln,font=f);d.text((320-(bb[0]+bb[2])/2,y),ln,font=f,fill=ink+(255,));y+=120
    im.save(path,quality=92)
TAGS={'web':'WEB DESIGN','graphic':'GRAPHIC DESIGN','photo':'PHOTO EDITING','video':'AI VIDEO','ai':'AI IMAGES','cs':'CS STUDENT'}
for sid,word,bg,ring,ink in SLIDES: tag(f'{R}/slider/{sid}.webp',TAGS[sid],hexc(bg),(255,255,255))
# menu thumbs
for i,(sid,word,bg,ring,ink) in enumerate(SLIDES[:5]):
    im=Image.new('RGB',(400,400),hexc(bg));d=ImageDraw.Draw(im,'RGBA')
    for k in range(4): x=rnd.randint(-60,300);y=rnd.randint(-60,300);s=rnd.randint(120,260);d.ellipse((x,y,x+s,y+s),fill=hexc(ink)+(120,))
    im.save(f'{R}/menu-{i+1}.webp',quality=85)
# ---------- SVGs ----------
def text_path(text,size,cx,base,font=INTER):
    f=TTFont(font);gs=f.getGlyphSet();cm=f.getBestCmap();upm=f['head'].unitsPerEm;sc=size/upm
    w=sum(gs[cm[ord(c)]].width for c in text)*sc;x=cx-w/2;pen=SVGPathPen(gs)
    for c in text:
        g=cm[ord(c)];gs[g].draw(TransformPen(pen,(sc,0,0,-sc,x,base)));x+=gs[g].width*sc
    return pen.getCommands()
logo=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 191 118"><rect x="2" y="2" width="187" height="114" rx="26" fill="#60a000"/><path d="{text_path('MUNEEB',36,95.5,54)}" fill="#f4ffd6"/><path d="{text_path('REHMAN',36,95.5,96)}" fill="#f4ffd6"/></svg>'''
open(f'{R}/preloader-image.svg','w').write(logo)
for i in (1,2,3):
    open(f'{R}/index-{i}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#fff"/><path d="{text_path("0"+str(i),64,60,82)}" fill="#034102"/></svg>')
ICONS={'stationery':('#2261E9','M30 70l-15-15 15-15M70 40l15 15-15 15M56 32l-12 46'),'cloth':('#e84c4c','M28 74l32-32 14 14-32 32zM64 38l8-8 14 14-8 8'),'double':('#17a679','M30 30h40v40H30zM70 42l16-9v34l-16-9'),'mask':('#f2a900','M50 28l7 15h16l-13 10 5 16-15-10-15 10 5-16-13-10h16z')}
for k,(c,p) in ICONS.items():
    open(f'{R}/footer-{k}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="{c}"/><path d="{p}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>')
open(f'{R}/new-cursor.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="52" viewBox="0 0 48 52"><path d="M11 12l8 30 6-12 14-4z" fill="#fff" stroke="#034102" stroke-width="4" stroke-linejoin="round"/></svg>')
open(f'{R}/cursor-pointer.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" width="46" height="50" viewBox="0 0 46 50"><path d="M13 6l8 32 6-11 15-4z" fill="#b6fe00" stroke="#034102" stroke-width="4" stroke-linejoin="round"/></svg>')
open(f'{R}/cursor-type.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" width="26" height="41" viewBox="0 0 26 41"><path d="M6 4h14M6 37h14M13 4v33" stroke="#034102" stroke-width="4" stroke-linecap="round" fill="none"/></svg>')
open(f'{R}/../favicon.svg','w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#60a000"/><path d="'+text_path('MR',34,32,44)+'" fill="#f4ffd6"/></svg>')
# ---------- sounds ----------
SR=22050
def wav(path,sig):
    sig=np.clip(sig,-1,1);d=(sig*32000).astype('<i2')
    with wave.open(path,'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(d.tobytes())
t=lambda s:np.arange(int(SR*s))/SR
x=t(.35);wav(f'{R}/sounds/slide-change.wav',np.sin(2*np.pi*(300+900*x/.35)*x)*np.exp(-x*9)*.5+np.random.RandomState(1).randn(len(x))*np.exp(-x*20)*.15)
x=t(.18);wav(f'{R}/sounds/box-pop.wav',np.sin(2*np.pi*(500-1500*x)*x)*np.exp(-x*28)*.8)
x=t(.25);wav(f'{R}/sounds/sound-toggle.wav',(np.sin(2*np.pi*660*x)+np.sin(2*np.pi*990*x))*np.exp(-x*14)*.3)
x=t(.1);wav(f'{R}/sounds/menu-hover.wav',np.sin(2*np.pi*880*x)*np.exp(-x*40)*.3)
x=t(8);b=np.zeros_like(x)
for i,(f0,tm) in enumerate([(261.6,0),(329.6,2),(392,4),(329.6,6)]):
    m=(x>=tm)&(x<tm+2);xx=x[m]-tm;b[m]+=(np.sin(2*np.pi*f0*xx)+.4*np.sin(2*np.pi*f0*2*xx))*np.sin(np.pi*xx/2)*.25
wav(f'{R}/sounds/bgm.wav',b)
print('ok',len(os.listdir(R)))
