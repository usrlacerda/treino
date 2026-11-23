import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db";
import { addExercise, deleteExercise, saveWorkout, validateWorkout } from "./plan";
import { finishSession, logSet, startSession } from "./repo";
import type { Workout } from "./types";

let db: TreinoDB;
beforeEach(async () => { db = new TreinoDB("plan-" + Math.random()); await seedIfEmpty(db); });

const base = (): Workout => ({ id: "A", name: "Treino A", order: 1, items: [{ exerciseId: "leg-press", sets: 3, repMin: 8, repMax: 12, restSec: 90 }] });

describe("validação do treino", () => {
  const known = new Set(["leg-press", "cardio"]);
  it("aceita um treino válido", () => expect(validateWorkout(base(), known)).toEqual([]));
  it.each([
    ["séries 0", { sets: 0 }, /séries deve ser de 1 a 10/],
    ["séries 11", { sets: 11 }, /séries deve ser de 1 a 10/],
    ["mínimo maior que máximo", { repMin: 12, repMax: 8 }, /mínimo de repetições não pode ser maior/],
    ["repetições 0", { repMin: 0 }, /repetições devem ser de 1 a 50/],
    ["descanso negativo", { restSec: -1 }, /descanso deve ser de 0 a 600/],
    ["número quebrado", { sets: 2.5 }, /séries/],
    ["não numérico", { sets: NaN }, /séries/],
  ])("recusa %s", (_n, over, re) => {
    const w = base(); w.items[0] = { ...w.items[0], ...over };
    expect(validateWorkout(w, known).join(" ")).toMatch(re);
  });
  it("recusa nome vazio, sem exercícios e exercício desconhecido", () => {
    expect(validateWorkout({ ...base(), name: "  " }, known).join()).toMatch(/nome do treino/);
    expect(validateWorkout({ ...base(), items: [] }, known).join()).toMatch(/pelo menos 1/);
    const w = base(); w.items[0].exerciseId = "fantasma";
    expect(validateWorkout(w, known).join()).toMatch(/não encontrado/);
  });
  it("cardio valida a duração", () => {
    const w = base(); w.items = [{ exerciseId: "cardio", sets: 1, repMin: 0, repMax: 0, restSec: 0, durationMin: 0 }];
    expect(validateWorkout(w, known).join()).toMatch(/duração/);
    w.items[0].durationMin = 20;
    expect(validateWorkout(w, known)).toEqual([]);
  });
});

describe("salvar e exercícios próprios", () => {
  it("salva e relê o treino editado", async () => {
    const w = base(); w.items[0].sets = 4; w.name = " Treino A+ ";
    await saveWorkout(db, w);
    const got = await db.workouts.get("A");
    expect(got?.name).toBe("Treino A+");
    expect(got?.items[0].sets).toBe(4);
  });
  it("não grava treino inválido", async () => {
    const w = base(); w.items[0].sets = 99;
    await expect(saveWorkout(db, w)).rejects.toThrow(/séries/);
    expect((await db.workouts.get("A"))?.items[0].sets).not.toBe(99);
  });
  it("cria exercício próprio, recusa duplicado e nome vazio", async () => {
    const ex = await addExercise(db, { name: "  Remada curvada  ", muscle: "costas", equipment: "", cue: "Coluna neutra." });
    expect(ex.id.startsWith("custom-")).toBe(true);
    expect(ex.name).toBe("Remada curvada");
    expect(ex.equipment).toBe("Livre");
    await expect(addExercise(db, { name: "remada CURVADA", muscle: "costas", equipment: "", cue: "" })).rejects.toThrow(/Já existe/);
    await expect(addExercise(db, { name: " ", muscle: "costas", equipment: "", cue: "" })).rejects.toThrow(/nome/);
    await expect(addExercise(db, { name: "X", muscle: "nada" as never, equipment: "", cue: "" })).rejects.toThrow(/grupo muscular/);
  });
  it("só apaga exercício próprio que não esteja em treino nem em histórico", async () => {
    const ex = await addExercise(db, { name: "Prancha lateral", muscle: "abdomen", equipment: "", cue: "" });
    await expect(deleteExercise(db, "leg-press")).rejects.toThrow(/padrão/);
    const w = base(); w.items.push({ exerciseId: ex.id, sets: 3, repMin: 10, repMax: 12, restSec: 60 });
    await saveWorkout(db, w);
    await expect(deleteExercise(db, ex.id)).rejects.toThrow(/está em um treino/);
    w.items.pop(); await saveWorkout(db, w);
    const s = await startSession(db, "A");
    await logSet(db, s, { exerciseId: ex.id, setIndex: 0, weightKg: 5, reps: 10, doneAt: 1 });
    await finishSession(db, s);
    await expect(deleteExercise(db, ex.id)).rejects.toThrow(/histórico/);
    const ex2 = await addExercise(db, { name: "Outro", muscle: "peito", equipment: "", cue: "" });
    await deleteExercise(db, ex2.id);
    expect(await db.exercises.get(ex2.id)).toBeUndefined();
  });
});
