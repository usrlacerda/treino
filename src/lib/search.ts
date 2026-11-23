import { norm } from "./catalog";

/** Grupos de palavras que significam a mesma coisa para quem treina (português, inglês e gíria de academia). Tudo sem acento. */
const SYN: string[][] = [
  ["peito", "peitoral", "chest", "pectoral", "pec"],
  ["costas", "dorsal", "back", "lat", "lats", "grande dorsal"],
  ["ombro", "ombros", "deltoide", "deltoides", "shoulder", "delt", "delts"],
  ["biceps", "bicep", "braco"],
  ["triceps", "tricep"],
  ["perna", "pernas", "leg", "legs", "quadriceps", "coxa"],
  ["posterior", "hamstring", "hamstrings", "isquiotibiais"],
  ["gluteo", "gluteos", "glute", "glutes", "bumbum", "bunda"],
  ["panturrilha", "panturrilhas", "calf", "calves", "gemeos", "batata da perna"],
  ["abdomen", "abdominal", "abs", "barriga", "core", "ab"],
  ["antebraco", "forearm", "pulso", "punho", "wrist"],
  ["cardio", "aerobico", "aerobica"],
  ["supino", "bench", "bench press", "chest press"],
  ["agachamento", "agacha", "squat", "squats"],
  ["rosca", "curl", "curls"],
  ["remada", "row", "rows", "remo"],
  ["puxada", "pulldown", "pull down", "lat pulldown", "puxador", "pulley"],
  ["terra", "deadlift", "levantamento terra"],
  ["afundo", "avanco", "lunge", "lunges", "passada"],
  ["crucifixo", "fly", "flyes", "flye", "abertura"],
  ["voador", "peck deck", "pec deck", "peck-deck"],
  ["desenvolvimento", "press", "militar", "ombro press", "shoulder press", "overhead press"],
  ["elevacao", "raise", "raises"],
  ["extensao", "extension", "extensora", "extensions"],
  ["flexao", "pushup", "push up", "push-up", "flexoes"],
  ["flexora", "leg curl", "mesa flexora", "cadeira flexora"],
  ["barra fixa", "pullup", "pull up", "pull-up", "chin up", "chinup", "barra"],
  ["mergulho", "dip", "dips", "paralelas"],
  ["encolhimento", "shrug", "shrugs", "trapezio"],
  ["abdominal", "crunch", "crunches", "sit up", "situp", "sit-up"],
  ["prancha", "plank", "isometria"],
  ["polia", "cabo", "cable", "crossover", "pulley"],
  ["halter", "halteres", "dumbbell", "dumbbells", "haltere"],
  ["barra", "barbell", "bar"],
  ["maquina", "machine", "lever", "aparelho"],
  ["smith", "guiado"],
  ["elastico", "band", "faixa", "theraband", "mini band"],
  ["kettlebell", "kb", "kettle"],
  ["corpo", "bodyweight", "peso do corpo", "calistenia", "livre"],
  ["esteira", "treadmill", "corrida", "correr", "run", "running", "caminhada", "walk"],
  ["bicicleta", "bike", "ergometrica", "spinning", "cycle"],
  ["eliptico", "elliptical", "transport"],
  ["hack", "hack squat"],
  ["leg press", "legpress", "prensa", "leg 45"],
  ["stiff", "romeno", "romanian", "rdl"],
  ["coice", "kickback", "kick back"],
  ["francês", "frances", "overhead extension", "french press"],
  ["testa", "skull", "skullcrusher", "skull crusher", "lying triceps"],
  ["martelo", "hammer"],
  ["scott", "preacher"],
  ["inclinado", "incline"],
  ["declinado", "decline"],
  ["reto", "flat"],
  ["sentado", "seated", "sentada"],
  ["deitado", "lying", "deitada"],
  ["unilateral", "one arm", "single arm", "um braco", "uma perna", "single leg", "one leg"],
  ["pegada", "grip"],
  ["bola", "bola suica", "ball", "swiss ball", "stability ball", "bosu"],
  ["alongamento", "stretch", "alongar"],
  ["obliquo", "obliquos", "lateral abdominal", "oblique"],
  ["lombar", "lower back", "extensao lombar", "hiperextensao"],
  ["trapezio", "traps", "trap"],
  ["adutor", "adutora", "adductor", "adduction", "aducao"],
  ["abdutor", "abdutora", "abductor", "abduction", "abducao"],
  ["pullover", "pull over"],
  ["roda", "wheel", "rollout", "roll out", "ab wheel"],
  ["burpee", "burpees"],
  ["polichinelo", "jumping jack", "jumping jacks"],
  ["escalador", "mountain climber", "mountain climbers"],
  ["thruster", "thrusters"],
];

const tokens = (s: string) => norm(s).replace(/[^a-z0-9/]+/g, " ").trim().split(" ").filter(Boolean);
/** "leg press" casa com o texto inteiro; palavras soltas casam por token. */
const SYN_INDEX = (() => {
  const m = new Map<string, Set<number>>();
  SYN.forEach((g, n) => g.forEach((w) => { const k = norm(w).replace(/[^a-z0-9 ]+/g, " ").trim(); (m.get(k) ?? m.set(k, new Set()).get(k)!).add(n); }));
  return m;
})();

/** Distância de edição limitada (para tolerar erro de digitação). */
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/** Grupos de sinônimos que a consulta ativa (frase inteira ou palavra isolada). */
function groupsOf(q: string): Set<number> {
  const out = new Set<number>();
  const flat = tokens(q).join(" ");
  SYN_INDEX.get(flat)?.forEach((n) => out.add(n));
  for (const t of tokens(q)) SYN_INDEX.get(t)?.forEach((n) => out.add(n));
  // frases de 2 palavras seguidas ("leg press", "barra fixa")
  const ts = tokens(q);
  for (let i = 0; i + 1 < ts.length; i++) SYN_INDEX.get(`${ts[i]} ${ts[i + 1]}`)?.forEach((n) => out.add(n));
  return out;
}

export interface Searchable { name: string; en?: string; equipLabel?: string; groupLabel?: string; target?: string }

/** Pontuação de um exercício para uma palavra da busca; 0 = não casa. */
function scoreToken(t: string, words: string[], full: string): number {
  let best = 0;
  for (const w of words) {
    if (w === t) best = Math.max(best, 10);
    else if (w.startsWith(t) && t.length >= 2) best = Math.max(best, 8);
    else if (t.length >= 3 && w.includes(t)) best = Math.max(best, 5);
    else if (t.length >= 4 && w.length >= 4 && within(t, w, t.length >= 8 ? 2 : 1)) best = Math.max(best, 4);
  }
  if (!best && t.length >= 3 && full.includes(t)) best = 3;
  return best;
}

/** Ordena por relevância: aceita erro de digitação, sem acento, português ou inglês, e sinônimos de academia ("peck deck" → crucifixo na máquina). */
export function rank<T extends Searchable>(items: T[], query: string): T[] {
  const qs = tokens(query);
  if (!qs.length) return items;
  const qNorm = qs.join(" ");
  const qGroups = groupsOf(query);
  const phrase = SYN_INDEX.get(qNorm); // a busca inteira é um termo conhecido ("peck deck", "prensa")
  const scored: [T, number][] = [], partial: [T, number][] = [];
  const phraseHits = new Set<T>();
  for (const it of items) {
    const nameW = tokens(it.name), enW = tokens(it.en ?? ""), metaW = tokens(`${it.equipLabel ?? ""} ${it.groupLabel ?? ""} ${it.target ?? ""}`);
    const nameFull = nameW.join(" "), enFull = enW.join(" ");
    const itGroups = groupsOf(`${it.name} ${it.en ?? ""}`);
    let total = 0, hit = 0;
    for (const t of qs) {
      const s = Math.max(scoreToken(t, nameW, nameFull) * 1.0, scoreToken(t, enW, enFull) * 0.9, scoreToken(t, metaW, metaW.join(" ")) * 0.6);
      let v = s;
      if (!v) {
        // sinônimo: a palavra pertence a um grupo que o exercício também tem
        const g = groupsOf(t);
        if ([...g].some((n) => itGroups.has(n))) v = 6;
      }
      if (v) { hit++; total += v; }
    }
    const viaPhrase = !!phrase && qs.length > 1 && [...phrase].some((n) => itGroups.has(n));
    if (viaPhrase) { total += 40; hit = qs.length; phraseHits.add(it); }
    else if (phrase && qs.length === 1 && [...phrase].some((n) => itGroups.has(n))) { total += 40; hit = qs.length; }
    if (nameFull.includes(qNorm)) total += 12;
    if (nameFull.startsWith(qNorm)) total += 6;
    // frase conhecida ("peck deck", "leg press") presente no exercício
    if ([...qGroups].some((n) => itGroups.has(n)) && qs.length > 1) total += 4;
    if (hit === qs.length) scored.push([it, total + 20]);
    else if (hit > 0 && qs.length > 1 && hit >= Math.ceil(qs.length / 2)) partial.push([it, total]);
  }
  // termo composto conhecido ("peck deck"): mostra só o que realmente é aquilo, sem ruído de palavras parecidas
  const exact = phraseHits.size ? scored.filter(([it]) => phraseHits.has(it)) : [];
  const list = exact.length ? exact : scored.length ? scored : partial; // só mostra resultados parciais quando nada casa por inteiro
  list.sort((a, b) => b[1] - a[1] || a[0].name.length - b[0].name.length);
  return list.map(([it]) => it);
}
