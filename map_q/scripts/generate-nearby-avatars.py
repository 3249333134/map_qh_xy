"""Generate local illustrated demo avatars; no external identity/photo data."""
from pathlib import Path
from PIL import Image, ImageDraw
out = Path(__file__).resolve().parents[1] / 'static/nearby'
out.mkdir(exist_ok=True)
colors = [('#dce8df','#263d36','#7ba899'),('#e4e7ef','#323c50','#8095ae'),('#f0e2d9','#654735','#d59d80'),('#ede9d4','#494839','#9aab78'),('#e5dfe9','#3f3449','#b49bbc'),('#dae9e5','#353c38','#5d998c')]
for i,(bg,hair,shirt) in enumerate(colors):
 im=Image.new('RGBA',(240,240));d=ImageDraw.Draw(im)
 d.ellipse((8,8,232,232),fill='white');d.ellipse((17,17,223,223),fill=bg)
 d.ellipse((58,41,182,181),fill=hair)
 d.ellipse((39,163,201,282),fill=shirt)
 d.rounded_rectangle((105,143,135,188),radius=12,fill='#dfb398')
 d.ellipse((75,61,165,164),fill='#edc7ab')
 d.pieslice((69,35,174,118),180,352,fill=hair)
 if i%2==0:d.polygon([(75,79),(101,62),(87,120),(72,130)],fill=hair)
 else:d.polygon([(99,56),(164,73),(171,111),(133,84)],fill=hair)
 for x in [102,142]:d.ellipse((x-3,113,x+3,119),fill=hair)
 d.arc((110,129,132,143),5,170,fill='#ae7865',width=3)
 mask=Image.new('L',(240,240));ImageDraw.Draw(mask).ellipse((8,8,232,232),fill=255);im.putalpha(mask)
 im.resize((120,120),Image.Resampling.LANCZOS).save(out/f'avatar-{i+1}.png')
 for selected in [False,True]:
  marker=Image.new('RGBA',(256,272));md=ImageDraw.Draw(marker)
  md.ellipse((0,0,256,256),fill='#bde8ce' if selected else '#ffffff')
  marker.alpha_composite(im,(8,8))
  md=ImageDraw.Draw(marker)
  md.ellipse((182,190,244,252),fill='white');md.ellipse((192,200,234,242),fill='#66ae83' if i in [0,2,5] else '#b7c6bd')
  marker.resize((128,136),Image.Resampling.LANCZOS).save(out/f'marker-{i+1}{"-selected" if selected else ""}.png')
