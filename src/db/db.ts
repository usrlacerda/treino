import Dexie, { type Table } from "dexie";
import type { Exercise, Measure, Session, Workout } from "./types";
import { exercises, workouts } from "./seed";
import { LEGACY_IDS, migrateSession, migrateWorkout } from "./legacy";

export class TreinoDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  sessions!: Table<Session, number>;
  measures!: Table<Measure, number>;

  constructor(name = "treino") {
    super(name);
    this.version(1).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
    });
    this.version(2).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
    });
    // v3: todos os exercícios passam a ser do catálogo. Troca os ids antigos nos treinos e no histórico e põe os exercícios do protocolo na biblioteca.
    this.version(3).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
    }).upgrade(async (tx) => {
      await tx.table("exercises").bulkDelete(Object.keys(LEGACY_IDS));
      await tx.table("exercises").bulkPut(exercises);
      const ws = tx.table("workouts");
      for (const w of (await ws.toArray()) as Workout[]) await ws.put(migrateWorkout(w));
      const ss = tx.table("sessions");
      for (const s of (await ss.toArray()) as Session[]) await ss.put(migrateSession(s));
    });
    // v4: nomes dos exercícios do protocolo passam a ser os usados nas academias.
    this.version(4).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
    }).upgrade((tx) => tx.table("exercises").bulkPut(exercises));
    // v5: medidas corporais.
    this.version(5).stores({
      exercises: "id, muscle",
      workouts: "id, order",
      sessions: "++id, workoutId, startedAt",
      measures: "++id, date",
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
