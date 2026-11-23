import "fake-indexeddb/auto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { exportData, parseBackup } from "./db/backup";
import { validateWorkout } from "./db/plan";
import { finishSession, lastSetsForMany, logSet, startSession } from "./db/repo";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

describe("achados da revisão independente", () => {
  let db: TreinoDB;
  beforeEach(async () => { db = new TreinoDB("rv-" + Math.random()); await seedIfEmpty(db); });

  it("a tela recusa carga/reps que o backup recusaria", async () => {
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByText("Treino A"));
    await user.type(await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith"), "1200");
    await user.type(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith"), "8");
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/até 500 kg/);
    expect(await db.sessions.count()).toBe(0);
  });
  it("ida e volta do backup com os valores máximos aceitos na tela", async () => {
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: "ds-1463", setIndex: 0, weightKg: 500, reps: 100, doneAt: 5 });
    await finishSession(db, id);
    const data = JSON.parse(JSON.stringify(await exportData(db)));
    expect(() => parseBackup(data)).not.toThrow();
  });
  it("backup com série de exercício inexistente (ex.: __proto__) é recusado", async () => {
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: "ds-1463", setIndex: 0, weightKg: 10, reps: 5, doneAt: 5 });
    await finishSession(db, id);
    const b = JSON.parse(JSON.stringify(await exportData(db)));
    b.sessions[0].sets[0].exerciseId = "__proto__";
    expect(() => parseBackup(b)).toThrow(/não existe no backup/);
  });
  it("treino com exercício repetido ou cardio com várias séries é inválido", () => {
    const k = new Set(["ds-1463", "ds-3666"]);
    const it = { exerciseId: "ds-1463", sets: 3, repMin: 8, repMax: 10, restSec: 60 };
    expect(validateWorkout({ id: "x", name: "X", order: 0, items: [it, { ...it }] }, k)[0]).toMatch(/já está no treino/);
    expect(validateWorkout({ id: "x", name: "X", order: 0, items: [{ ...it, exerciseId: "ds-3666", sets: 0, repMin: 0, repMax: 0, restSec: 0, durationMin: 10 }] }, k)[0]).toMatch(/cardio tem 1 série/);
  });
  it("lastSetsForMany devolve a última sessão concluída de cada exercício", async () => {
    const a = await startSession(db, "A");
    await logSet(db, a, { exerciseId: "ds-1463", setIndex: 0, weightKg: 10, reps: 5, doneAt: 1 });
    await finishSession(db, a);
    await new Promise((r) => setTimeout(r, 5));
    const b = await startSession(db, "B");
    await logSet(db, b, { exerciseId: "ds-1463", setIndex: 0, weightKg: 20, reps: 5, doneAt: 2 });
    await finishSession(db, b);
    const r = await lastSetsForMany(db, ["ds-1463", "ds-3666"]);
    expect(r["ds-1463"][0].weightKg).toBe(20);
    expect(r["ds-3666"]).toEqual([]);
  });
  it("falha ao gravar mostra mensagem e permite tentar de novo", async () => {
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByText("Treino A"));
    await user.type(await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith"), "40");
    await user.type(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith"), "8");
    const spy = vi.spyOn(db.sessions, "add").mockRejectedValueOnce(new Error("quota"));
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Não conseguimos salvar/);
    spy.mockRestore();
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" })).toHaveAttribute("aria-pressed", "true"));
  });
});

describe("retomar treino em andamento", () => {
  it("sessão recente com séries continua aberta e é retomada com os valores; antiga é fechada; vazia é apagada", async () => {
    const { closeStaleSessions, findResumable } = await import("./db/repo");
    const db = new TreinoDB("rs-" + Math.random()); await seedIfEmpty(db);
    const now = Date.now();
    const recent = await startSession(db, "A");
    await logSet(db, recent, { exerciseId: "ds-0770", setIndex: 0, weightKg: 42.5, reps: 8, doneAt: now - 60_000 });
    const old = await startSession(db, "B");
    await logSet(db, old, { exerciseId: "ds-1463", setIndex: 0, weightKg: 10, reps: 5, doneAt: now - 7 * 3600_000 });
    const empty = await startSession(db, "C");
    await closeStaleSessions(db, now);
    expect((await db.sessions.get(old))?.finishedAt).toBeDefined();
    expect(await db.sessions.get(empty)).toBeUndefined();
    expect((await db.sessions.get(recent))?.finishedAt).toBeUndefined();
    expect((await findResumable(db))?.id).toBe(recent);
  });
  it("Home oferece Continuar treino e a tela volta com a série marcada", async () => {
    const db = new TreinoDB("rs2-" + Math.random()); await seedIfEmpty(db);
    const ex = (await db.workouts.get("A"))!.items[0].exerciseId;
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: ex, setIndex: 0, weightKg: 42.5, reps: 8, doneAt: Date.now() });
    const user = userEvent.setup();
    render(<App db={db} />);
    expect(await screen.findByText(/Treino em andamento/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar treino" }));
    const name = (await db.exercises.get(ex))!.name;
    const btn = await screen.findByRole("button", { name: `Série 1 concluída, ${name}` });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(`Carga em kg, série 1, ${name}`)).toHaveValue("42,5");
    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    expect(await screen.findByText(/Treino salvo: 1 série/)).toBeInTheDocument();
    expect(await db.sessions.count()).toBe(1);
  });
  it("Encerrar e salvar fecha a sessão aberta", async () => {
    const db = new TreinoDB("rs3-" + Math.random()); await seedIfEmpty(db);
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: "ds-1463", setIndex: 0, weightKg: 10, reps: 5, doneAt: Date.now() });
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByRole("button", { name: "Encerrar e salvar" }));
    await waitFor(() => expect(screen.queryByText(/Treino em andamento/)).toBeNull());
    expect((await db.sessions.get(id))?.finishedAt).toBeDefined();
  });
});
