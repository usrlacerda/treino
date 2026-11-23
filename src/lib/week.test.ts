import { describe, expect, it } from "vitest";
import { greeting, relativeDay, summarizeWeek, weekStart } from "./week";
import type { Session } from "../db/types";

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime();
const sess = (when: number, kg = 50, reps = 10, n = 2): Session => ({ workoutId: "A", startedAt: when, finishedAt: when + 3_600_000, sets: Array.from({ length: n }, (_, i) => ({ exerciseId: "x", setIndex: i, weightKg: kg, reps, doneAt: when })) });
// quarta-feira, 2026-11-25
const NOW = at(2026, 11, 25, 12);

describe("semana", () => {
  it("começa na segunda", () => { expect(new Date(weekStart(NOW)).getDay()).toBe(1); expect(new Date(weekStart(NOW)).getDate()).toBe(23); });
  it("marca os dias treinados e soma o volume", () => {
    const r = summarizeWeek([sess(at(2026, 11, 23)), sess(at(2026, 11, 25, 8), 100, 5, 1)], NOW);
    expect(r.days).toEqual([true, false, true, false, false, false, false]);
    expect(r.today).toBe(2); expect(r.count).toBe(2); expect(r.volume).toBe(1000 + 500);
  });
  it("compara com a semana passada e ignora treinos em andamento", () => {
    const open = { ...sess(at(2026, 11, 24)), finishedAt: undefined };
    const r = summarizeWeek([sess(at(2026, 11, 17)), open], NOW);
    expect(r.count).toBe(0); expect(r.prevCount).toBe(1); expect(r.prevVolume).toBe(1000);
  });
  it("conta semanas seguidas; a semana atual vazia não quebra a sequência", () => {
    const s = [sess(at(2026, 11, 10)), sess(at(2026, 11, 17))];
    expect(summarizeWeek(s, NOW).streakWeeks).toBe(2);
    expect(summarizeWeek([...s, sess(at(2026, 11, 24))], NOW).streakWeeks).toBe(3);
    expect(summarizeWeek([sess(at(2026, 10, 20))], NOW).streakWeeks).toBe(0);
  });
  it("domingo ainda é da semana que começou na segunda", () => {
    const r = summarizeWeek([sess(at(2026, 11, 29))], at(2026, 11, 29, 20));
    expect(r.today).toBe(6); expect(r.days[6]).toBe(true);
  });
});
describe("textos", () => {
  it("dia relativo", () => {
    expect(relativeDay(NOW, NOW)).toBe("hoje");
    expect(relativeDay(at(2026, 11, 24), NOW)).toBe("ontem");
    expect(relativeDay(at(2026, 11, 20), NOW)).toBe("há 5 dias");
    expect(relativeDay(at(2026, 11, 1), NOW)).toBe("há 3 semanas");
  });
  it("saudação", () => { expect(greeting(new Date(2026, 0, 1, 8))).toBe("Bom dia"); expect(greeting(new Date(2026, 0, 1, 15))).toBe("Boa tarde"); expect(greeting(new Date(2026, 0, 1, 21))).toBe("Boa noite"); });
});
