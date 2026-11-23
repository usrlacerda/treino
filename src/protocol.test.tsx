import "fake-indexeddb/auto";
import Dexie from "dexie";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { LEGACY_WORKOUTS_V1 } from "./db/seed";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

// Protocolo do Treino Trinca (conferido na página do protocolo em 2026-11-23).
const PROTOCOLO: Record<string, [string, number, number, number][]> = {
  A: [["Abdominal crunch na máquina", 3, 12, 50], ["Agachamento no Smith", 3, 12, 50], ["Puxada frontal aberta", 3, 12, 50], ["Supino reto com halteres", 3, 12, 50], ["Rosca direta com barra", 3, 12, 50], ["Tríceps corda no pulley", 3, 12, 50]],
  B: [["Prancha abdominal", 3, 30, 50], ["Leg press", 3, 12, 50], ["Panturrilha no leg press", 3, 15, 50], ["Remada baixa com triângulo", 3, 12, 50], ["Supino inclinado na máquina", 3, 12, 50], ["Elevação lateral com halteres", 3, 12, 50]],
  C: [["Abdominal deitado", 3, 12, 50], ["Agachamento com halter", 3, 12, 50], ["Puxada frontal pegada fechada", 3, 12, 50], ["Crucifixo na máquina", 3, 12, 50], ["Desenvolvimento na máquina", 3, 12, 50], ["Tríceps testa com halter", 3, 12, 50]],
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
      expect(w.items.at(-1)).toMatchObject({ exerciseId: "cardio", durationMin: 15 });
    }
  });

  it("migra quem já tinha a versão antiga sem tocar em treinos editados", async () => {
    const name = "mig-" + Math.random();
    const v1 = new Dexie(name);
    v1.version(1).stores({ exercises: "id, muscle", workouts: "id, order", sessions: "++id, workoutId, startedAt" });
    const edited = { ...LEGACY_WORKOUTS_V1[1], name: "Meu B" };
    await v1.table("workouts").bulkAdd([LEGACY_WORKOUTS_V1[0], edited, LEGACY_WORKOUTS_V1[2]]);
    v1.close();
    const db = new TreinoDB(name);
    const a = (await db.workouts.get("A"))!;
    expect(a.items[0].exerciseId).toBe("abd-maquina");
    expect((await db.workouts.get("B"))!.name).toBe("Meu B");
    expect((await db.workouts.get("B"))!.items[0].exerciseId).toBe("leg-press");
    expect((await db.workouts.get("C"))!.items[0].exerciseId).toBe("abd-deitado");
    expect(await db.exercises.get("prancha")).toMatchObject({ timed: true });
  });

  it("prancha é por tempo: sem campos de carga, registra os segundos e inicia o descanso de 50 s", async () => {
    const db = new TreinoDB("pr2-" + Math.random()); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByRole("button", { name: /^Treino B/ }));
    expect(await screen.findByText("3 séries · 30 s · descanso 50s")).toBeInTheDocument();
    expect(screen.queryByLabelText("Carga em kg, série 1, Prancha abdominal")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Prancha abdominal" }));
    expect(await screen.findByRole("timer")).toHaveTextContent("0:50");
    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    await waitFor(async () => expect((await db.sessions.toArray())[0].sets[0]).toMatchObject({ exerciseId: "prancha", weightKg: 0, reps: 30 }));
  });
});
