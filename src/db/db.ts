import Dexie, { type Table } from "dexie";
import type { Exercise, Session, Workout } from "./types";
import { exercises, LEGACY_WORKOUTS_V1, workouts } from "./seed";

export class TreinoDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  sessions!: Table<Session, number>;

  constructor(name = "treino") {
    super(name);
    this.version(1).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
    });
    // v2: treinos A/B/C iguais ao protocolo. Só troca os que ainda estão como na primeira versão (não mexe nos editados).
    this.version(2).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
    }).upgrade(async (tx) => {
      await tx.table("exercises").bulkPut(exercises);
      const table = tx.table("workouts");
      for (const w of workouts) {
        const legacy = LEGACY_WORKOUTS_V1.find((l) => l.id === w.id)!;
        const current = await table.get(w.id);
        if (current && JSON.stringify(current) === JSON.stringify(legacy)) await table.put(w);
      }
    });
  }
}

/** Carrega os treinos A/B/C e a biblioteca só na primeira abertura. */
export async function seedIfEmpty(db: TreinoDB): Promise<boolean> {
  if ((await db.workouts.count()) > 0) return false;
  await db.transaction("rw", db.exercises, db.workouts, async () => {
    await db.exercises.bulkAdd(exercises);
    await db.workouts.bulkAdd(workouts);
  });
  return true;
}

export const db = new TreinoDB();
