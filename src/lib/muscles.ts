import type { Muscle } from "../db/types";

export const MUSCLE_LABEL: Record<Muscle, string> = {
  peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps", triceps: "Tríceps",
  quadriceps: "Quadríceps", posterior: "Posterior de coxa", gluteos: "Glúteos",
  panturrilha: "Panturrilha", abdomen: "Abdômen", antebraco: "Antebraço", cardio: "Cardio",
};
export const MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];
