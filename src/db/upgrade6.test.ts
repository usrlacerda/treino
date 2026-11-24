import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { TreinoDB } from "./db";

describe("banco v6", () => {
  it("abre um banco v5 com medidas, remove a tabela e mantém os treinos", async () => {
    const name = "up6-" + Math.random();
    const old = new Dexie(name);
    old.version(5).stores({ exercises: "id, muscle", workouts: "id, order", sessions: "++id, workoutId, startedAt", measures: "++id, date" });
    await old.table("sessions").add({ workoutId: "A", startedAt: 1, finishedAt: 2, sets: [] });
    await old.table("measures").add({ date: 1, weightKg: 80 });
    old.close();
    const db = new TreinoDB(name);
    await db.open();
    expect(db.tables.map((t) => t.name)).not.toContain("measures");
    expect(await db.sessions.count()).toBe(1);
    db.close();
  });
});
