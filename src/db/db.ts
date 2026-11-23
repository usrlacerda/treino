import Dexie, { type Table } from "dexie";
import type { Exercise, Session, Workout } from "./types";
import { exercises, workouts } from "./seed";

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
