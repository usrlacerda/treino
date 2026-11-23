import { describe, expect, it } from "vitest";
import { platesFor } from "./plates";
import { sessionText } from "./share";
import { getGoal, setGoal } from "./goal";

describe("anilhas", () => {
  it("60 kg com barra de 20: 20 de cada lado", () => expect(platesFor(60).perSide).toEqual([20]));
  it("87,5 kg: 25 + 5 + 2,5 + 1,25 de cada lado... confere o total", () => {
    const r = platesFor(87.5); expect(r.perSide).toEqual([25, 5, 2.5, 1.25]); expect(r.achieved).toBe(87.5); expect(r.missing).toBe(0);
  });
  it("só a barra quando a carga é igual à barra", () => expect(platesFor(20).perSide).toEqual([]));
  it("avisa o que sobra quando não dá para montar", () => expect(platesFor(21).missing).toBe(1));
});

describe("meta da semana", () => {
  it("usa 3 por padrão, guarda e limita entre 1 e 7", () => {
    localStorage.clear(); expect(getGoal()).toBe(3);
    setGoal(5); expect(getGoal()).toBe(5);
    setGoal(99); expect(getGoal()).toBe(7);
  });
});

describe("resumo para compartilhar", () => {
  it("lista exercícios, séries, volume e anotação", () => {
    const t = sessionText({ workoutId: "A", startedAt: 1700000000000, finishedAt: 1700003000000, note: "ombro ok",
      sets: [{ exerciseId: "x", setIndex: 0, weightKg: 40, reps: 10, doneAt: 1 }, { exerciseId: "x", setIndex: 1, weightKg: 42.5, reps: 8, doneAt: 2 }] }, "Treino A", () => "Supino");
    expect(t).toContain("• Supino: 40×10, 42,5×8");
    expect(t).toContain("2 séries");
    expect(t).toContain("Anotação: ombro ok");
  });
});
