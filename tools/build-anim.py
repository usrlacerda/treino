"""Converte os GIFs do dataset para WebP animado leve em public/catalog/anim/<id>.webp. Mídia © Gym visual."""
import json, sys, os
from PIL import Image
src = sys.argv[1]; out = "public/catalog/anim"; total = 0
for e in json.load(open(f"{src}/data/exercises.json")):
    im = Image.open(f"{src}/{e['gif_url']}"); frames = []; durs = []
    for k in range(im.n_frames):
        im.seek(k); frames.append(im.convert("RGB").resize((180, 180), Image.LANCZOS)); durs.append(im.info.get("duration", 100))
    p = f"{out}/{e['id']}.webp"
    frames[0].save(p, "WEBP", save_all=True, append_images=frames[1:], duration=durs, loop=0, quality=40, method=4)
    total += os.path.getsize(p)
print(round(total/1e6, 1), "MB")
