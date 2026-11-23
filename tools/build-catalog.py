"""Gera public/catalog (índice compacto + miniaturas webp) a partir de hasaneyldrm/exercises-dataset.
Uso: python3 tools/build-catalog.py <pasta do dataset clonado>. Mídia © Gym visual (https://gymvisual.com/)."""
import json, sys, os
from PIL import Image
src = sys.argv[1]; out = "public/catalog"
MUSCLE = {"abs":"abdomen","pectorals":"peito","biceps":"biceps","glutes":"gluteos","delts":"ombros","triceps":"triceps",
 "upper back":"costas","lats":"costas","traps":"costas","spine":"costas","levator scapulae":"costas","calves":"panturrilha",
 "quads":"quadriceps","adductors":"quadriceps","abductors":"gluteos","hamstrings":"posterior","forearms":"antebraco",
 "serratus anterior":"abdomen","cardiovascular system":"cardio"}
data = json.load(open(f"{src}/data/exercises.json"))
NAMES = json.load(open("tools/names-pt.json"))  # nomes em português (padrão de academia); o nome original em inglês vai junto para a busca
rows = []; total = 0
for e in data:
    i = e["id"]; m = MUSCLE[e["target"]]
    im = Image.open(f"{src}/{e['image']}").convert("RGB").resize((160, 160), Image.LANCZOS)
    p = f"{out}/img/{i}.webp"; im.save(p, "WEBP", quality=55, method=6); total += os.path.getsize(p)
    rows.append([i, NAMES.get(i, e["name"]), m, e["equipment"], e["target"], e["name"]])
import unicodedata
rows.sort(key=lambda r: unicodedata.normalize("NFD", r[1]).encode("ascii", "ignore").decode().lower())  # ordem alfabética em português
json.dump(rows, open(f"{out}/index.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(rows), "exercícios;", round(total/1e6, 1), "MB de miniaturas;", round(os.path.getsize(f"{out}/index.json")/1e3), "KB de índice")
