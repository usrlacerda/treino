import { nextLoad, progressionHint } from "./progression";
import type { LoggedSet, PlanItem } from "../db/types";

const item = (over: Partial<PlanItem> = {}): PlanItem => ({ exerciseId: "x", sets: 3, repMin: 8, repMax: 10, restSec: 90, ...over });
const sets = (w: number, reps: number[]): LoggedSet[] => reps.map((r, i) => ({ exerciseId: "x", setIndex: i, weightKg: w, reps: r, doneAt: i }));

describe("progressão dupla", () => {
  it("todas as séries no topo da faixa: sobe a carga", () => {
    expect(progressionHint(item(), sets(40, [10, 10, 10]))).toEqual({ kind: "increase", fromKg: 40, toKg: 42, sets: 3, reps: 10 });
  });
  it("uma série abaixo do topo: sem dica (continue buscando repetições)", () => {
    expect(progressionHint(item(), sets(40, [10, 9, 10]))).toBeNull();
  });
  it("uma série abaixo do mínimo: mantém ou reduz", () => {
    expect(progressionHint(item(), sets(40, [10, 8, 7]))).toEqual({ kind: "below", weightKg: 40, repMin: 8 });
  });
  it("séries incompletas na última vez: sem dica", () => {
    expect(progressionHint(item(), sets(40, [10, 10]))).toBeNull();
  });
  it("cardio, sem histórico e carga zero: sem dica", () => {
    expect(progressionHint(item({ durationMin: 15 }), sets(0, [0]))).toBeNull();
    expect(progressionHint(item(), [])).toBeNull();
    expect(progressionHint(item(), sets(0, [12, 12, 12]))).toBeNull();
  });
  it("faixa fixa (12-12): bater 12 em todas sobe", () => {
    expect(progressionHint(item({ repMin: 12, repMax: 12 }), sets(20, [12, 12, 12]))?.kind).toBe("increase");
  });
  it("com cargas diferentes usa a menor", () => {
    const s = [...sets(40, [10, 10]), { exerciseId: "x", setIndex: 2, weightKg: 35, reps: 10, doneAt: 3 }];
    expect(progressionHint(item(), s)).toMatchObject({ kind: "increase", fromKg: 35 });
  });
  it("incremento: 5% em múltiplos de 0,5, mínimo 1 kg", () => {
    expect(nextLoad(40)).toBe(42);
    expect(nextLoad(20)).toBe(21);
    expect(nextLoad(10)).toBe(11);
    expect(nextLoad(100)).toBe(105);
    expect(nextLoad(42.5)).toBe(44.5);
  });
});
