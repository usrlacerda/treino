import type { TreinoDB } from "./db";
import type { Exercise, Muscle, PlanItem, Workout } from "./types";
import { MUSCLES } from "../lib/muscles";

const inRange = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;

/** Lista de problemas em português (vazia = válido). */
export function validateWorkout(w: Workout, known: Set<string>): string[] {
  const errs: string[] = [];
  const name = w.name.trim();
  if (name.length < 1 || name.length > 40) errs.push("O nome do treino deve ter de 1 a 40 caracteres.");
  if (w.items.length < 1) errs.push("O treino precisa de pelo menos 1 exercício.");
  if (w.items.length > 20) errs.push("O treino pode ter no máximo 20 exercícios.");
  w.items.forEach((it, n) => {
    const at = `Exercício ${n + 1}`;
    if (!known.has(it.exerciseId)) errs.push(`${at}: exercício não encontrado na biblioteca.`);
    else if (w.items.findIndex((o) => o.exerciseId === it.exerciseId) !== n) errs.push(`${at}: este exercício já está no treino.`);
    if (it.durationMin !== undefined) {
      if (!inRange(it.durationMin, 1, 180)) errs.push(`${at}: a duração deve ser de 1 a 180 minutos.`);
      if (it.sets !== 1) errs.push(`${at}: o cardio tem 1 série.`);
      return;
    }
    if (!inRange(it.sets, 1, 10)) errs.push(`${at}: o número de séries deve ser de 1 a 10.`);
    if (!inRange(it.repMin, 1, 50) || !inRange(it.repMax, 1, 50)) errs.push(`${at}: as repetições devem ser de 1 a 50.`);
    else if (it.repMin > it.repMax) errs.push(`${at}: o mínimo de repetições não pode ser maior que o máximo.`);
    if (!inRange(it.restSec, 0, 600)) errs.push(`${at}: o descanso deve ser de 0 a 600 segundos.`);
  });
  return errs;
}

export async function saveWorkout(db: TreinoDB, w: Workout): Promise<void> {
  const known = new Set((await db.exercises.toArray()).map((e) => e.id));
  const errs = validateWorkout(w, known);
  if (errs.length) throw new Error(errs[0]);
  const items: PlanItem[] = w.items.map((i) => ({ ...i }));
  await db.workouts.put({ ...w, name: w.name.trim(), items });
}

export interface NewExercise { name: string; muscle: Muscle; equipment: string; cue: string }

export async function addExercise(db: TreinoDB, input: NewExercise): Promise<Exercise> {
  const name = input.name.trim();
  const equipment = input.equipment.trim();
  const cue = input.cue.trim();
  if (name.length < 1 || name.length > 60) throw new Error("O nome do exercício deve ter de 1 a 60 caracteres.");
  if (!MUSCLES.includes(input.muscle)) throw new Error("Escolha o grupo muscular.");
  if (equipment.length > 40) throw new Error("O equipamento deve ter até 40 caracteres.");
  if (cue.length > 200) throw new Error("A dica de execução deve ter até 200 caracteres.");
  const dup = (await db.exercises.toArray()).some((e) => e.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
  if (dup) throw new Error("Já existe um exercício com esse nome.");
  const ex: Exercise = { id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name, muscle: input.muscle, equipment: equipment || "Livre", cue };
  await db.exercises.add(ex);
  return ex;
}

/** Só exercícios próprios, e só se não estiverem em nenhum treino nem no histórico. */
export async function deleteExercise(db: TreinoDB, id: string): Promise<void> {
  if (!id.startsWith("custom-")) throw new Error("Os exercícios da biblioteca padrão não podem ser apagados.");
  if ((await db.workouts.toArray()).some((w) => w.items.some((i) => i.exerciseId === id)))
    throw new Error("Este exercício está em um treino. Remova-o do treino antes de apagar.");
  if ((await db.sessions.toArray()).some((s) => s.sets.some((x) => x.exerciseId === id)))
    throw new Error("Este exercício tem histórico e não pode ser apagado.");
  await db.exercises.delete(id);
}
