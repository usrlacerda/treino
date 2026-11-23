"""Gera public/catalog/info/<n>.json (passo a passo em português + músculos que ajudam) a partir do dataset e das traduções.
Uso: python3 tools/build-details.py <exercises.json do dataset> <pasta com all_unique.json e out_NN.json>"""
import json, sys, glob, os
src, tr = sys.argv[1], sys.argv[2]
data = json.load(open(src))
uniq = json.load(open(f"{tr}/all_unique.json"))
pt = []
for f in sorted(glob.glob(f"{tr}/out_[0-9][0-9].json")): pt += json.load(open(f))
assert len(pt) == len(uniq), (len(pt), len(uniq))
T = dict(zip(uniq, pt))
SEC = {"abdominals":"abdômen","ankle stabilizers":"estabilizadores do tornozelo","ankles":"tornozelos","back":"costas","biceps":"bíceps","brachialis":"braquial",
"calves":"panturrilhas","chest":"peitoral","core":"core","deltoids":"deltoides","feet":"pés","forearms":"antebraços","glutes":"glúteos","grip muscles":"músculos da pegada",
"groin":"adutores","hamstrings":"posteriores de coxa","hands":"mãos","hip flexors":"flexores do quadril","inner thighs":"parte interna da coxa","latissimus dorsi":"dorsais","lats":"dorsais",
"lower abs":"abdômen inferior","lower back":"lombar","obliques":"oblíquos","quadriceps":"quadríceps","rear deltoids":"deltoide posterior","rhomboids":"romboides","rotator cuff":"manguito rotador",
"shins":"canelas","shoulders":"ombros","soleus":"sóleo","sternocleidomastoid":"esternocleidomastóideo","trapezius":"trapézio","traps":"trapézio","triceps":"tríceps","upper back":"parte alta das costas",
"upper chest":"peitoral superior","wrist extensors":"extensores do punho","wrist flexors":"flexores do punho","wrists":"punhos"}
os.makedirs("public/catalog/info", exist_ok=True); total = 0
for e in data:
    s = list(dict.fromkeys(SEC[m] for m in e["secondary_muscles"]))
    p = [T[x] for x in e["instruction_steps"]["en"]]
    path = f"public/catalog/info/{e['id']}.json"
    json.dump({"p": p, "s": s}, open(path, "w"), ensure_ascii=False, separators=(",", ":")); total += os.path.getsize(path)
print(len(data), "arquivos;", round(total/1e6, 2), "MB")
