import type { Exercise, Muscle } from "../db/types";

/** Item do catálogo: [id, nome (inglês), grupo, equipamento (inglês), alvo (inglês)]. Dados: hasaneyldrm/exercises-dataset; mídia © Gym visual. */
export type CatalogRow = [string, string, Muscle, string, string, string?];
export interface CatalogItem { id: string; name: string; muscle: Muscle; equipment: string; target: string; en?: string }

export const EQUIPMENT_PT: Record<string, string> = {
  "body weight": "Peso do corpo", dumbbell: "Halteres", cable: "Polia", barbell: "Barra", "leverage machine": "Máquina",
  band: "Faixa elástica", "smith machine": "Smith", kettlebell: "Kettlebell", weighted: "Com peso", "stability ball": "Bola suíça",
  "ez barbell": "Barra W", assisted: "Assistido", "sled machine": "Máquina trenó", "medicine ball": "Bola medicinal", rope: "Corda",
  roller: "Rolo", "resistance band": "Faixa elástica", "bosu ball": "Bosu", "olympic barbell": "Barra olímpica", "wheel roller": "Roda abdominal",
  "upper body ergometer": "Ergômetro de braços", "skierg machine": "SkiErg", hammer: "Marreta", "stationary bike": "Bicicleta ergométrica",
  tire: "Pneu", "trap bar": "Barra hexagonal", "elliptical machine": "Elíptico", "stepmill machine": "Escada rolante",
};
export const TARGET_PT: Record<string, string> = {
  abs: "abdominais", pectorals: "peitoral", biceps: "bíceps", glutes: "glúteos", delts: "deltoides", triceps: "tríceps",
  "upper back": "parte superior das costas", lats: "dorsais", traps: "trapézio", spine: "coluna", "levator scapulae": "elevador da escápula",
  calves: "panturrilhas", quads: "quadríceps", adductors: "adutores", abductors: "abdutores", hamstrings: "posteriores de coxa",
  forearms: "antebraços", "serratus anterior": "serrátil anterior", "cardiovascular system": "sistema cardiovascular",
};
export const equipmentPt = (e: string) => EQUIPMENT_PT[e] ?? e;
export const targetPt = (t: string) => TARGET_PT[t] ?? t;

export const toItem = (r: CatalogRow): CatalogItem => ({ id: r[0], name: r[1], muscle: r[2], equipment: r[3], target: r[4], en: r[5] });
/** Remove acentos e caixa para a busca. */
export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

let cache: Promise<CatalogItem[]> | undefined;
/** Baixa o índice uma vez (fica no cache do service worker para uso offline). */
export function loadCatalog(): Promise<CatalogItem[]> {
  cache ??= fetch(`${import.meta.env.BASE_URL}catalog/index.json`)
    .then((r) => { if (!r.ok) throw new Error("Não conseguimos carregar o catálogo."); return r.json() as Promise<CatalogRow[]>; })
    .then((rows) => rows.map(toItem))
    .catch((e) => { cache = undefined; throw e; });
  return cache;
}

/** Só para testes. */
export const resetCatalogCache = () => { cache = undefined; };

export const catalogExerciseId = (id: string) => `ds-${id}`;
export function toExercise(c: CatalogItem): Exercise {
  return { id: catalogExerciseId(c.id), name: c.name, muscle: c.muscle, equipment: equipmentPt(c.equipment).slice(0, 40), cue: `Alvo: ${targetPt(c.target)}.`, ...(/^Prancha/.test(c.name) ? { timed: true } : {}) };
}
