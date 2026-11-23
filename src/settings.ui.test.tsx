import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { exportData } from "./db/backup";
import { finishSession, logSet, startSession } from "./db/repo";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const fresh = () => new TreinoDB("set-" + Math.random());

let created: Blob[] = [];
beforeEach(() => {
  created = [];
  URL.createObjectURL = vi.fn((b: Blob) => { created.push(b); return "blob:teste"; });
  URL.revokeObjectURL = vi.fn();
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Ajustes" }));
  await screen.findByRole("heading", { name: "Ajustes" });
}
async function dataset() {
  const db = fresh(); await seedIfEmpty(db);
  const id = await startSession(db, "B");
  await logSet(db, id, { exerciseId: "ds-1463", setIndex: 0, weightKg: 100, reps: 10, doneAt: 1700000000000 });
  await finishSession(db, id);
  return JSON.stringify(await exportData(db));
}
const file = (text: string, name = "treino-backup.json") => new File([text], name, { type: "application/json" });

describe("ajustes: backup", () => {
  it("exporta um arquivo JSON válido e registra a data do último backup", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openSettings(user);
    expect(screen.getByText("Você ainda não exportou nenhum backup.")).toBeInTheDocument();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await user.click(screen.getByRole("button", { name: "Exportar backup" }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent(/Backup gerado: treino-backup-\d{4}-\d{2}-\d{2}\.json/);
    expect(created).toHaveLength(1);
    const parsed = JSON.parse(await created[0].text());
    expect(parsed.app).toBe("treino");
    expect(parsed.workouts).toHaveLength(3);
    expect(screen.getByText(/Último backup: /)).toBeInTheDocument();
  });

  it("importa depois de confirmar e mostra o resumo", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openSettings(user);
    await user.upload(screen.getByLabelText("Importar backup"), file(await dataset()));
    const dlg = await screen.findByRole("alertdialog", { name: "Substituir seus dados?" });
    expect(dlg).toHaveTextContent("1 sessão");
    await user.click(screen.getByRole("button", { name: "Substituir meus dados" }));
    expect(await screen.findByText("Backup importado: 3 treinos, 1 sessão.")).toBeInTheDocument();
    expect(await db.sessions.count()).toBe(1);
  });

  it("cancelar não altera nada", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openSettings(user);
    await user.upload(screen.getByLabelText("Importar backup"), file(await dataset()));
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await db.sessions.count()).toBe(0);
  });

  it.each([
    ["texto qualquer", "isso não é json", /não é JSON/],
    ["outro app", JSON.stringify({ app: "outro" }), /não é um backup do Treino/],
    ["dados absurdos", "__BAD__", /Arquivo inválido: carga/],
  ])("recusa arquivo inválido: %s", async (_n, content, re) => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openSettings(user);
    let text = content;
    if (content === "__BAD__") { const b = JSON.parse(await dataset()); b.sessions[0].sets[0].weightKg = 9e9; text = JSON.stringify(b); }
    await user.upload(screen.getByLabelText("Importar backup"), file(text));
    expect(await screen.findByRole("alert")).toHaveTextContent(re);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await db.sessions.count()).toBe(0);
  });

  it("recusa arquivo acima de 5 MB sem tentar ler", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await openSettings(user);
    const big = file("x"); Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("Importar backup"), big);
    expect(await screen.findByRole("alert")).toHaveTextContent("grande demais");
  });

  it("mostra o aviso de saúde, o crédito e a promessa de privacidade", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await openSettings(user);
    expect(screen.getByText(/consulte um profissional/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gym visual" })).toHaveAttribute("href", "https://gymvisual.com/");
    expect(screen.getByText(/não envia seus dados a nenhum servidor/)).toBeInTheDocument();
  });
});
