export type Muscle =
  | "peito" | "costas" | "ombros" | "biceps" | "triceps"
  | "quadriceps" | "posterior" | "gluteos" | "panturrilha" | "abdomen" | "antebraco" | "cardio";

export interface Exercise {
  id: string;
  name: string;
  muscle: Muscle;
  equipment: string;
  cue: string; // dica curta de execução
  timed?: boolean; // exercício por tempo: "repetições" são segundos (ex.: prancha)
}

export interface PlanItem {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  durationMin?: number; // só cardio
}

export interface Workout {
  id: string; // "A" | "B" | "C" ou id próprio
  name: string;
  order: number;
  items: PlanItem[];
}

export interface LoggedSet {
  exerciseId: string;
  setIndex: number;
  weightKg: number;
  reps: number;
  doneAt: number;
}

export interface Session {
  id?: number;
  workoutId: string;
  startedAt: number;
  finishedAt?: number;
  sets: LoggedSet[];
  note?: string; // anotação do treino (ex.: "ombro incomodou")
}

