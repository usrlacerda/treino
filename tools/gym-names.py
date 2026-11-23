"""Segunda passada nos nomes em português: troca por como a academia chama o exercício.
Uso: python3 tools/gym-names.py  (lê/atualiza tools/names-pt.json e public/catalog/index.json)."""
import json, re, unicodedata, collections
IDX = "public/catalog/index.json"; NAMES = "tools/names-pt.json"
rows = json.load(open(IDX)); names = json.load(open(NAMES))

# por id: nome que todo mundo usa (inclui os 24 do protocolo)
OVERRIDE = {
 "1452": "Abdominal na máquina", "0770": "Agachamento no Smith", "2330": "Puxada frontal aberta", "0289": "Supino reto com halteres",
 "0031": "Rosca direta com barra", "0200": "Tríceps corda no pulley", "3666": "Esteira inclinada", "2135": "Prancha",
 "1463": "Leg press 45°", "1391": "Panturrilha no leg press", "0180": "Remada baixa", "1299": "Supino inclinado na máquina",
 "0334": "Elevação lateral com halteres", "0274": "Abdominal supra", "1760": "Agachamento goblet", "2616": "Puxada com triângulo",
 "0596": "Crucifixo na máquina (voador)", "0603": "Desenvolvimento na máquina", "0351": "Tríceps testa com halteres",
 "0432": "Stiff com halteres", "0586": "Mesa flexora", "0313": "Rosca martelo", "1409": "Elevação pélvica com barra", "0405": "Desenvolvimento com halteres",
 "2141": "Elíptico", "0798": "Bicicleta ergométrica", "2311": "Simulador de escada", "0198": "Puxada frontal", "0814": "Mergulho nas paralelas",
}
# regras em ordem; a primeira que casar vale
RULES = [
 (r"^Abdominal crunch sentado na máquina$", "Abdominal na máquina"),
 (r"^Abdominal crunch no chão$", "Abdominal supra"),
 (r"^Abdominal crunch$", "Abdominal supra"),
 (r"^Abdominal crunch inverso", "Abdominal infra"),
 (r"^Abdominal crunch ", "Abdominal "),
 (r"^Levantamento terra romeno", "Terra romeno"),
 (r"^Levantamento terra ", "Terra "),
 (r"^Ponte de glúteos", "Elevação pélvica"),
 (r"^Agachamento hack no sled$", "Agachamento hack"),
 (r"^Agachamento com barra$", "Agachamento livre"),
 (r"^Puxada com barra reta na polia$", "Puxada frontal com barra reta"),
 (r"^Remada baixa sentada na polia", "Remada baixa"),
 (r"^Press Pallof (.*)$", r"Pallof press \1"),
 (r"^Extensão de tríceps deitad[oa] ", "Tríceps testa "),
 (r"^Extensão de tríceps acima da cabeça ", "Tríceps francês "),
 (r"^Mergulho de tríceps no banco$", "Tríceps no banco"),
 (r"^Mergulho de tríceps entre bancos$", "Tríceps entre bancos"),
 (r"^Mergulho de tríceps na máquina$", "Mergulho na máquina"),
 (r"^Mergulho de tríceps nas paralelas altas com peso$", "Mergulho nas paralelas com peso"),
 (r"^Mergulho de tríceps com peso$", "Mergulho nas paralelas com peso"),
]
def base(n): return re.sub(r", variação \d+$", "", n)
new = {}
for r in rows:
    i = r[0]; n = base(names.get(i, r[1]))
    for pat, rep in RULES:
        if re.search(pat, n): n = re.sub(pat, rep, n); break
    n = OVERRIDE.get(i, n)
    new[i] = n
groups = collections.defaultdict(list)
for r in sorted(rows, key=lambda r: (r[0] not in OVERRIDE, r[0])): groups[new[r[0]]].append(r[0])
for n, ids in groups.items():
    if len(ids) > 1:
        for k, i in enumerate(ids[1:], 2): new[i] = f"{n}, variação {k}"
for r in rows: r[1] = new[r[0]]; names[r[0]] = new[r[0]]
key = lambda r: unicodedata.normalize("NFD", r[1]).encode("ascii", "ignore").decode().lower()
rows.sort(key=key)
json.dump(rows, open(IDX, "w"), ensure_ascii=False, separators=(",", ":")); json.dump(names, open(NAMES, "w"), ensure_ascii=False)
print(len(rows), "nomes;", sum(1 for k in groups.values() if len(k) > 1), "grupos com variação")
