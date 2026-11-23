import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db";
import { exercises, workouts } from "./seed";
import { finishSession, lastSetsFor, logSet, nextWorkoutId, startSession } from "./repo";

let db: TreinoDB;
beforeEach(async () => {
  db = new TreinoDB("teste-" + Math.random());
  await seedIfEmpty(db);
});

describe("seed", () => {
  it("carrega A/B/C e é idempotente", async () => {
    expect(await db.workouts.count()).toBe(3);
    expect(await seedIfEmpty(db)).toBe(false);
    expect(await db.exercises.count()).toBe(exercises.length);
  });
  it("todo item do plano aponta para um exercício existente", () => {
    const ids = new Set(exercises.map((e) => e.id));
    for (const w of workouts) for (const i of w.items) expect(ids.has(i.exerciseId), i.exerciseId).toBe(true);
  });
  it("faixas de repetição são válidas", () => {
    for (const w of workouts) for (const i of w.items.filter((x) => !x.durationMin)) expect(i.repMin).toBeLessThanOrEqual(i.repMax);
  });
});

describe("sessões", () => {
  it("registra série, atualiza a mesma série e não duplica", async () => {
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: "agach-smith", setIndex: 0, weightKg: 40, reps: 8, doneAt: 1 });
    await logSet(db, id, { exerciseId: "agach-smith", setIndex: 0, weightKg: 42, reps: 9, doneAt: 2 });
    const s = await db.sessions.get(id);
    expect(s?.sets).toHaveLength(1);
    expect(s?.sets[0].weightKg).toBe(42);
  });
  it("falha ao registrar em sessão inexistente", async () => {
    await expect(logSet(db, 999, { exerciseId: "x", setIndex: 0, weightKg: 1, reps: 1, doneAt: 1 })).rejects.toThrow();
  });
  it("mostra a última vez só de sessões concluídas", async () => {
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: "agach-smith", setIndex: 0, weightKg: 40, reps: 8, doneAt: 1 });
    expect(await lastSetsFor(db, "agach-smith")).toHaveLength(0);
    await finishSession(db, id);
    expect((await lastSetsFor(db, "agach-smith"))[0].weightKg).toBe(40);
  });
  it("sugere o próximo treino em rodízio A→B→C→A", async () => {
    expect(await nextWorkoutId(db)).toBe("A");
    for (const w of ["A", "B", "C"]) {
      const id = await startSession(db, w);
      await finishSession(db, id);
      await new Promise((r) => setTimeout(r, 2));
    }
    expect(await nextWorkoutId(db)).toBe("A");
  });
});

import { closeStaleSessions, discardSession, listFinishedSessions } from "./repo";

describe("sessões abandonadas", () => {
  it("apaga as vazias e conclui as com séries, sem perder dados", async () => {
    const vazia = await startSession(db, "A");
    const comSeries = await startSession(db, "B");
    await logSet(db, comSeries, { exerciseId: "leg-press", setIndex: 0, weightKg: 100, reps: 10, doneAt: 5000 });
    await closeStaleSessions(db);
    expect(await db.sessions.get(vazia)).toBeUndefined();
    const s = await db.sessions.get(comSeries);
    expect(s?.finishedAt).toBe(5000);
    expect(s?.sets).toHaveLength(1);
  });
  it("lista só concluídas, da mais nova para a mais antiga; descartar remove", async () => {
    const a = await startSession(db, "A"); await finishSession(db, a);
    await new Promise((r) => setTimeout(r, 3));
    const b = await startSession(db, "B"); await finishSession(db, b);
    const aberta = await startSession(db, "C");
    expect((await listFinishedSessions(db)).map((s) => s.id)).toEqual([b, a]);
    await discardSession(db, aberta);
    expect(await db.sessions.get(aberta)).toBeUndefined();
  });
});
