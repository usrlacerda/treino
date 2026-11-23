import { e1rm, personalRecords, pointsFor, sessionVolume } from "./stats";
import type { Session } from "../db/types";

const set = (exerciseId: string, setIndex: number, weightKg: number, reps: number) => ({ exerciseId, setIndex, weightKg, reps, doneAt: 1 });
const sess = (id: number, startedAt: number, sets: Session["sets"], finished = true): Session =>
  ({ id, workoutId: "A", startedAt, finishedAt: finished ? startedAt + 1 : undefined, sets });

describe("stats", () => {
  it("e1RM: 1 repetição vale a própria carga; mais repetições estimam mais", () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1);
    expect(e1rm(0, 10)).toBe(0);
    expect(e1rm(50, 0)).toBe(0);
  });
  const data = [
    sess(1, 1000, [set("a", 0, 40, 10), set("a", 1, 45, 8)]),
    sess(2, 2000, [set("a", 0, 45, 10), set("b", 0, 20, 12)]),
    sess(3, 3000, [set("a", 0, 99, 5)], false), // aberta: ignorada
  ];
  it("pontos: um por treino concluído, série mais pesada, em ordem de data", () => {
    const pts = pointsFor([data[1], data[0], data[2]], "a");
    expect(pts.map((p) => [p.sessionId, p.topWeight, p.topReps])).toEqual([[1, 45, 8], [2, 45, 10]]);
    expect(pts[0].volume).toBe(40 * 10 + 45 * 8);
  });
  it("recordes ignoram sessão aberta e desempatam por repetições", () => {
    const r = personalRecords(data, "a")!;
    expect(r.maxWeight).toEqual({ weightKg: 45, reps: 10, date: 2000 });
    expect(r.bestE1rm.weightKg).toBe(45);
    expect(r.bestE1rm.reps).toBe(10);
  });
  it("sem registros: nulo", () => {
    expect(personalRecords(data, "zzz")).toBeNull();
    expect(pointsFor(data, "zzz")).toEqual([]);
  });
  it("volume da sessão", () => {
    expect(sessionVolume(data[0])).toBe(40 * 10 + 45 * 8);
  });
});
