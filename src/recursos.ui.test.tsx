import "fake-indexeddb/auto";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { exportData, importBackup, parseBackup } from "./db/backup";
import { finishSession, logSet, startSession } from "./db/repo";
import { App } from "./App";
import { History } from "./screens/History";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const fresh = () => new TreinoDB("rc-" + Math.random());
beforeEach(() => localStorage.clear());

async function withHistory(weight = 40) {
  const db = fresh(); await seedIfEmpty(db);
  const id = await startSession(db, "A");
  await logSet(db, id, { exerciseId: "ds-0770", setIndex: 0, weightKg: weight, reps: 10, doneAt: Date.now() });
  await finishSession(db, id);
  return db;
}
const AGACH = "Agachamento no Smith";
async function doSet(user: ReturnType<typeof userEvent.setup>, w: string, r: string) {
  const kg = await screen.findByLabelText(`Carga em kg, série 1, ${AGACH}`);
  await user.clear(kg); await user.type(kg, w);
  const reps = screen.getByLabelText(`Repetições (reps), série 1, ${AGACH}`);
  await user.clear(reps); await user.type(reps, r);
  await user.click(screen.getByRole("button", { name: `Série 1 concluída, ${AGACH}` }));
}

describe("treino ativo: recursos", () => {
  it("avisa novo recorde de carga e mantém a tela acesa", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });
    const db = await withHistory(40);
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await user.click(await screen.findByText("Treino A"));
    await waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    await doSet(user, "40", "10");
    await screen.findByRole("button", { name: "Finalizar treino" });
    expect(screen.queryByText(/Novo recorde/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: `Série 1 concluída, ${AGACH}` })); // desmarca
    await doSet(user, "45", "8");
    expect(await screen.findByText(/Novo recorde! Agachamento no Smith: 45 kg \(antes: 40 kg\)/)).toBeInTheDocument();
  });

  it("anotação do treino é salva e aparece no histórico", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await user.click(await screen.findByText("Treino A"));
    await doSet(user, "30", "10");
    await user.type(await screen.findByLabelText(/Anotação do treino/), "ombro incomodou");
    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    await waitFor(async () => expect((await db.sessions.toArray())[0].note).toBe("ombro incomodou"));
  });

  it("calculadora de anilhas mostra os discos de cada lado", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} initialTab="treinos" />);
    await user.click(await screen.findByText("Treino A"));
    await user.click(await screen.findByRole("button", { name: "Calculadora de anilhas" }));
    const dlg = await screen.findByRole("dialog", { name: "Calculadora de anilhas" });
    await user.type(within(dlg).getByLabelText("Carga total (kg)"), "60");
    expect(within(dlg).getByText(/20 kg/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("histórico: compartilhar", () => {
  it("compartilhar copia o resumo quando o aparelho não tem compartilhamento", async () => {
    const db = await withHistory();
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<History db={db} />);
    await user.click(await screen.findByRole("button", { name: /^Compartilhar treino Treino A/ }));
    expect(await screen.findByText(/Resumo copiado/)).toBeInTheDocument();
    expect(writeText.mock.calls[0][0]).toContain("Treino A");
  });

});

describe("meta da semana e backup", () => {
  it("Início mostra o progresso da meta e Ajustes muda a meta", async () => {
    const db = await withHistory();
    const user = userEvent.setup();
    render(<App db={db} />);
    expect(await screen.findByRole("group", { name: "Meta da semana" })).toHaveTextContent("1 de 3 treinos");
    await user.click(screen.getByRole("button", { name: "Ajustes" }));
    await user.selectOptions(await screen.findByLabelText("Meta de treinos por semana"), "1");
    await user.click(screen.getByRole("button", { name: "Início" }));
    expect(await screen.findByRole("group", { name: "Meta da semana" })).toHaveTextContent("1 de 1 treino");
    expect(screen.getByText(/meta batida/)).toBeInTheDocument();
  });

  it("backup leva as anotações dos treinos junto", async () => {
    const db = await withHistory();
    await db.sessions.toCollection().modify({ note: "boa" });
    const b = parseBackup(JSON.parse(JSON.stringify(await exportData(db))));
    const other = fresh(); await seedIfEmpty(other);
    await importBackup(other, b);
    expect((await other.sessions.toArray())[0].note).toBe("boa");
  });
});
