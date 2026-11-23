import type { Session, Workout } from "./types";

/** Ids dos exercícios do protocolo antes de passarem a usar o catálogo → id equivalente no catálogo. Serve para migrar dados, backups e planos antigos. */
export const LEGACY_IDS: Record<string, string> = {
  "abd-maquina": "ds-1452",
  "agach-smith": "ds-0770",
  "puxada-aberta": "ds-2330",
  "supino-halteres": "ds-0289",
  "rosca-barra": "ds-0031",
  "triceps-corda": "ds-0200",
  "cardio": "ds-3666",
  "prancha": "ds-2135",
  "leg-press": "ds-1463",
  "panturrilha-leg": "ds-1391",
  "remada-baixa": "ds-0180",
  "supino-inclinado-maq": "ds-1299",
  "elevacao-lateral": "ds-0334",
  "abd-deitado": "ds-0274",
  "agach-halter": "ds-1760",
  "puxada-fechada": "ds-2616",
  "crucifixo-maq": "ds-0596",
  "desenv-maquina": "ds-0603",
  "triceps-testa": "ds-0351",
  "stiff-halteres": "ds-0432",
  "mesa-flexora": "ds-0586",
  "rosca-martelo": "ds-0313",
  "elev-pelvica": "ds-1409",
  "desenv-halteres": "ds-0405",
};
export const migrateId = (id: string): string => LEGACY_IDS[id] ?? id;

export function migrateWorkout(w: Workout): Workout {
  const seen = new Set<string>();
  const items = w.items.map((i) => ({ ...i, exerciseId: migrateId(i.exerciseId) })).filter((i) => !seen.has(i.exerciseId) && !!seen.add(i.exerciseId));
  return { ...w, items };
}
export const migrateSession = (s: Session): Session => ({ ...s, sets: s.sets.map((x) => ({ ...x, exerciseId: migrateId(x.exerciseId) })) });
