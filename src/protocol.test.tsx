import "fake-indexeddb/auto";
import Dexie from "dexie";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

// Protocolo do Treino Trinca (conferido na página do protocolo em 2026-11-23).
const PROTOCOLO: Record<string, [string, number, number, number][]> = {
  A: [["Abdominal crunch sentado na máquina", 3, 12, 50], ["Agachamento no Smith", 3, 12, 50], ["Puxada na polia com amplitude total", 3, 12, 50], ["Supino reto com halteres", 3, 12, 50], ["Rosca direta com barra", 3, 12, 50], ["Tríceps corda no pulley", 3, 12, 50]],
  B: [["Prancha frontal", 3, 30, 50], ["Leg press 45°", 3, 12, 50], ["Panturrilha no leg press", 3, 15, 50], ["Remada baixa sentada na polia", 3, 12, 50], ["Supino inclinado na máquina", 3, 12, 50], ["Elevação lateral com halteres", 3, 12, 50]],
  C: [["Abdominal crunch no chão", 3, 12, 50], ["Agachamento goblet com halteres", 3, 12, 50], ["Puxada com barra V na polia", 3, 12, 50], ["Crucifixo sentado na máquina", 3, 12, 50], ["Desenvolvimento na máquina", 3, 12, 50], ["Extensão de tríceps deitada com halteres", 3, 12, 50]],
};

describe("treinos idênticos ao protocolo", () => {
  it("A, B e C têm exatamente os exercícios, ordem, séries, repetições e descanso do protocolo, com cardio de 15 min no fim", async () => {
    const db = new TreinoDB("pr-" + Math.random()); await seedIfEmpty(db);
    const names = Object.fromEntries((await db.exercises.toArray()).map((e) => [e.id, e.name]));
    for (const id of ["A", "B", "C"]) {
      const w = (await db.workouts.get(id))!;
      const items = w.items.slice(0, -1).map((i) => [names[i.exerciseId], i.sets, i.repMax, i.restSec]);
      expect(items).toEqual(PROTOCOLO[id]);
      expect(w.items.every((i, n) => n === w.items.length - 1 || i.repMin === i.repMax)).toBe(true);
      expect(w.items.at(-1)).toMatchObject({ exerciseId: "ds-3666", durationMin: 15 });
    }
  });

  it("migra quem já tinha a versão antiga: troca os ids em treinos e histórico e preserva treinos editados", async () => {
    const name = "mig-" + Math.random();
    const v2 = new Dexie(name);
    v2.version(2).stores({ exercises: "id, muscle", workouts: "id, order", sessions: "++id, workoutId, startedAt" });
    const it = (exerciseId: string) => ({ exerciseId, sets: 3, repMin: 12, repMax: 12, restSec: 50 });
    await v2.table("exercises").bulkAdd([{ id: "leg-press", name: "Leg press", muscle: "gluteos", equipment: "", cue: "" }, { id: "custom-x", name: "Meu", muscle: "peito", equipment: "", cue: "" }]);
    await v2.table("workouts").bulkAdd([{ id: "B", name: "Meu B", order: 1, items: [it("leg-press"), it("custom-x")] }]);
    await v2.table("sessions").add({ workoutId: "B", startedAt: 1, finishedAt: 2, sets: [{ exerciseId: "leg-press", setIndex: 0, weightKg: 80, reps: 12, doneAt: 1 }] });
    v2.close();
    const db = new TreinoDB(name);
    const b = (await db.workouts.get("B"))!;
    expect(b.name).toBe("Meu B");
    expect(b.items.map((i) => i.exerciseId)).toEqual(["ds-1463", "custom-x"]);
    expect((await db.sessions.toArray())[0].sets[0]).toMatchObject({ exerciseId: "ds-1463", weightKg: 80 });
    expect(await db.exercises.get("leg-press")).toBeUndefined();
    expect(await db.exercises.get("ds-1463")).toMatchObject({ name: "Leg press 45°" });
    expect(await db.exercises.get("ds-2135")).toMatchObject({ timed: true });
  });

  it("prancha é por tempo: sem campos de carga, registra os segundos e inicia o descanso de 50 s", async () => {
    const db = new TreinoDB("pr2-" + Math.random()); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByRole("button", { name: /^Treino B/ }));
    expect(await screen.findByText("3 séries · 30 s · descanso 50s")).toBeInTheDocument();
    expect(screen.queryByLabelText("Carga em kg, série 1, Prancha frontal")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Prancha frontal" }));
    expect(await screen.findByRole("timer")).toHaveTextContent("0:50");
    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    await waitFor(async () => expect((await db.sessions.toArray())[0].sets[0]).toMatchObject({ exerciseId: "ds-2135", weightKg: 0, reps: 30 }));
  });
});
