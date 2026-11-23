import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { finishSession, logSet, startSession } from "./db/repo";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

async function seedLast(db: TreinoDB, reps: number[], weight = 40) {
  await seedIfEmpty(db);
  // faixa de 8 a 10 repetições para exercitar a progressão dupla
  const a = (await db.workouts.get("A"))!;
  a.items = a.items.map((i) => (i.exerciseId === "ds-0770" ? { ...i, repMin: 8, repMax: 10 } : i));
  await db.workouts.put(a);
  const id = await startSession(db, "A");
  for (let i = 0; i < reps.length; i++) await logSet(db, id, { exerciseId: "ds-0770", setIndex: i, weightKg: weight, reps: reps[i], doneAt: i + 1 });
  await finishSession(db, id);
}

describe("progressão dupla na tela", () => {
  it("sugere subir a carga e já preenche carga nova e repetições iniciais", async () => {
    const db = new TreinoDB("prog-" + Math.random());
    await seedLast(db, [10, 10, 10]);
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await user.click(await screen.findByText("Treino A"));
    expect(await screen.findByText(/Hora de subir a carga: 40 → 42 kg/)).toBeInTheDocument();
    expect(screen.getByLabelText("Carga em kg, série 1, Agachamento no Smith")).toHaveValue("42");
    expect(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith")).toHaveValue("8");
  });
  it("avisa quando a última vez ficou abaixo da faixa e mantém a carga", async () => {
    const db = new TreinoDB("prog-" + Math.random());
    await seedLast(db, [10, 8, 6]);
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await user.click(await screen.findByText("Treino A"));
    expect(await screen.findByText(/ficou abaixo de 8 repetições com 40 kg/)).toBeInTheDocument();
    expect(screen.getByLabelText("Carga em kg, série 1, Agachamento no Smith")).toHaveValue("40");
  });
  it("sem dica quando ainda há repetições a ganhar", async () => {
    const db = new TreinoDB("prog-" + Math.random());
    await seedLast(db, [10, 9, 9]);
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await user.click(await screen.findByText("Treino A"));
    await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
