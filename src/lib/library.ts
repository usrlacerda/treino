import type { Exercise, Muscle } from "../db/types";
import { catalogExerciseId, equipmentPt, targetPt, toExercise, type CatalogItem } from "./catalog";

export type GroupId = "peito" | "costas" | "ombros" | "pernas" | "gluteos" | "biceps" | "triceps" | "antebraco" | "abdomen" | "cardio";
export interface Group { id: GroupId; label: string; muscles: Muscle[]; view: "front" | "back"; featured: string[] }

/** Grupos da Biblioteca, na ordem em que aparecem. "featured" são ids do catálogo usados como exemplos no cartão. */
export const GROUPS: Group[] = [
  { id: "peito", label: "Peito", muscles: ["peito"], view: "front", featured: ["0025", "0314", "0596"] },
  { id: "costas", label: "Costas", muscles: ["costas"], view: "back", featured: ["0652", "0027", "0861"] },
  { id: "ombros", label: "Ombros", muscles: ["ombros"], view: "front", featured: ["0334", "0405", "0178"] },
  { id: "pernas", label: "Pernas", muscles: ["quadriceps", "posterior", "panturrilha"], view: "front", featured: ["0770", "1463", "0586"] },
  { id: "gluteos", label: "Glúteos", muscles: ["gluteos"], view: "back", featured: ["1409", "0860", "3561"] },
  { id: "biceps", label: "Bíceps", muscles: ["biceps"], view: "front", featured: ["0294", "0031", "0313"] },
  { id: "triceps", label: "Tríceps", muscles: ["triceps"], view: "back", featured: ["0200", "0351", "0061"] },
  { id: "antebraco", label: "Antebraço", muscles: ["antebraco"], view: "front", featured: ["0126", "0369", "0385"] },
  { id: "abdomen", label: "Abdômen", muscles: ["abdomen"], view: "front", featured: ["1452", "0274", "2135"] },
  { id: "cardio", label: "Cardio", muscles: ["cardio"], view: "front", featured: ["0685", "3666", "2331"] },
];
export const groupOfMuscle = (m: Muscle): GroupId => GROUPS.find((g) => g.muscles.includes(m))!.id;

export type EquipKey = "barra" | "halteres" | "polia" | "maquina" | "smith" | "corpo" | "elastico" | "kettlebell" | "outros";
export const EQUIP_FILTERS: { key: EquipKey; label: string }[] = [
  { key: "barra", label: "Barra" }, { key: "halteres", label: "Halteres" }, { key: "polia", label: "Polia" }, { key: "maquina", label: "Máquina" },
  { key: "smith", label: "Smith" }, { key: "corpo", label: "Peso do corpo" }, { key: "elastico", label: "Elástico" }, { key: "kettlebell", label: "Kettlebell" }, { key: "outros", label: "Outros" },
];
/** Aceita o equipamento do catálogo (inglês) ou o texto em português de um exercício já salvo. */
export function equipKey(raw: string): EquipKey {
  const e = raw.toLowerCase();
  if (/barbell|trap bar|\bbarra\b/.test(e)) return "barra";
  if (/dumbbell|halter/.test(e)) return "halteres";
  if (/cable|rope|polia|corda/.test(e)) return "polia";
  if (/smith/.test(e)) return "smith";
  if (/machine|máquina|maquina|ergometer|stationary bike|esteira|el[ií]ptico|bicicleta/.test(e)) return "maquina";
  if (/body weight|assisted|weighted|wheel|peso do corpo|assistido|com peso/.test(e)) return "corpo";
  if (/band|elást|elast|faixa/.test(e)) return "elastico";
  if (/kettlebell/.test(e)) return "kettlebell";
  return "outros";
}

export interface LibItem { id: string; name: string; en?: string; group: GroupId; equip: EquipKey; equipLabel: string; target: string; custom: boolean; ex: Exercise }

export function buildItems(catalog: CatalogItem[] | undefined, saved: Exercise[]): LibItem[] {
  const out: LibItem[] = [];
  if (catalog) {
    for (const c of catalog) {
      const ex = toExercise(c);
      out.push({ id: ex.id, name: c.name, en: c.en, group: groupOfMuscle(c.muscle), equip: equipKey(c.equipment), equipLabel: equipmentPt(c.equipment), target: targetPt(c.target), custom: false, ex });
    }
    for (const e of saved) if (e.id.startsWith("custom-")) out.push(fromSaved(e, true));
  } else {
    // sem catálogo (primeiro acesso sem internet): mostra o que já está salvo no aparelho
    for (const e of saved) out.push(fromSaved(e, e.id.startsWith("custom-")));
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
const fromSaved = (e: Exercise, custom: boolean): LibItem =>
  ({ id: e.id, name: e.name, group: groupOfMuscle(e.muscle), equip: equipKey(e.equipment), equipLabel: e.equipment, target: e.cue.replace(/^Alvo:\s*/, "").replace(/\.$/, ""), custom, ex: e });

export const featuredFor = (g: Group, items: LibItem[]): LibItem[] =>
  g.featured.map((n) => items.find((i) => i.id === catalogExerciseId(n))).filter((i): i is LibItem => !!i);
