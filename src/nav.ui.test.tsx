import "fake-indexeddb/auto";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { finishSession, logSet, startSession } from "./db/repo";
import { App } from "./App";
import { resetCatalogCache } from "./lib/catalog";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const ROWS = [
  ["0002", "Supino reto com barra", "peito", "barbell", "pectorals", "barbell bench press"],
  ["0003", "Rosca direta com halteres", "biceps", "dumbbell", "biceps", "dumbbell curl"],
];
const fresh = () => new TreinoDB("nav-" + Math.random());
const voltar = async () => { await act(async () => { history.back(); await new Promise((r) => setTimeout(r, 30)); }); };
const tab = (name: string) => screen.findByRole("button", { name });

beforeEach(() => {
  resetCatalogCache();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ROWS })));
});

describe("Início", () => {
  it("abre primeiro, sugere o treino de hoje e tem 5 abas", async () => {
    const db = fresh(); await seedIfEmpty(db);
    render(<App db={db} />);
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Começar treino/ })).toBeInTheDocument();
    expect(screen.getByText("Para começar")).toBeInTheDocument();
    expect(screen.getByText(/Conclua seu primeiro treino/)).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Navegação" })).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });

  it("depois de um treino, sugere o seguinte e mostra a semana e o último treino", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const id = await startSession(db, "A");
    await logSet(db, id, { exerciseId: "ds-0770", setIndex: 0, weightKg: 40, reps: 10, doneAt: Date.now() });
    await finishSession(db, id);
    render(<App db={db} />);
    expect(await screen.findByRole("heading", { name: "Treino B" })).toBeInTheDocument();
    expect(screen.getByText("Treino de hoje")).toBeInTheDocument();
    const wk = screen.getByRole("region", { name: "Esta semana" });
    expect(within(wk).getByText("treino")).toBeInTheDocument();
    expect(within(wk).getByText(/kg de volume/)).toBeInTheDocument();
    const last = screen.getByRole("region", { name: "Último treino" });
    expect(last).toHaveTextContent("Treino A · hoje");
    expect(last).toHaveTextContent("1 série · 400 kg de volume");
  });

  it("Começar treino abre o treino sugerido", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByRole("button", { name: /Começar treino/ }));
    expect(await screen.findByRole("button", { name: "Finalizar treino" })).toBeInTheDocument();
  });
});

describe("botão voltar", () => {
  it("de outra aba volta ao Início", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Biblioteca"));
    await user.click(await tab("Histórico")); // trocar de aba não empilha: um voltar basta
    await screen.findByRole("heading", { name: "Histórico" });
    await voltar();
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });

  it("tocar em Início numa outra aba leva ao Início", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Ajustes"));
    await user.click(await tab("Início"));
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument();
  });

  it("com séries marcadas, o voltar pergunta; voltar de novo continua o treino; 'Salvar e sair' fecha e volta de onde veio", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Treinos"));
    await user.click(await screen.findByRole("button", { name: /^Treino A/ }));
    await screen.findByRole("button", { name: "Finalizar treino" });
    await user.type(screen.getAllByLabelText(/Carga em kg, série 1/)[0], "30");
    await user.type(screen.getAllByLabelText(/Repetições \(reps\), série 1/)[0], "10");
    await user.click(screen.getAllByRole("button", { name: /Série 1 concluída/ })[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Série 1 concluída/ })[0]).toHaveAttribute("aria-pressed", "true"));
    await voltar();
    expect(await screen.findByRole("alertdialog", { name: "Sair do treino?" })).toBeInTheDocument();
    await voltar(); // voltar com a pergunta aberta = continuar treino
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Finalizar treino" })).toBeInTheDocument();
    await voltar();
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Salvar e sair" }));
    expect(await screen.findByText(/Treino salvo: 1 série/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Treinos" })).toHaveAttribute("aria-current", "page");
    expect((await db.sessions.toArray())[0].finishedAt).toBeDefined();
  });

  it("sair do treino sem registrar nada pelo voltar não cria sessão", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByRole("button", { name: /Começar treino/ }));
    await screen.findByRole("button", { name: "Finalizar treino" });
    await voltar();
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument();
    expect(await db.sessions.count()).toBe(0);
  });

  it("no grupo da Biblioteca, voltar mostra os grupos; na janela do exercício, voltar só fecha a janela", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Biblioteca"));
    await user.click(await screen.findByRole("button", { name: /^Bíceps\s*1 exercício/ }));
    await user.click(await screen.findByRole("button", { name: "Ampliar demonstração de Rosca direta com halteres" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await voltar();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Bíceps" })).toBeInTheDocument(); // ainda no grupo
    await voltar();
    expect(await screen.findByRole("button", { name: /^Peito\s*1 exercício/ })).toBeInTheDocument(); // lista de grupos
    expect(screen.getByRole("button", { name: "Biblioteca" })).toHaveAttribute("aria-current", "page");
    await voltar();
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument(); // Início
  });

  it("fechar a janela pelo X não deixa entrada sobrando: o próximo voltar sai da aba", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Biblioteca"));
    await user.click(await screen.findByRole("button", { name: /^Bíceps\s*1 exercício/ }));
    await user.click(await screen.findByRole("button", { name: "Ampliar demonstração de Rosca direta com halteres" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    await voltar(); // sai do grupo (não é consumido por uma entrada velha da janela)
    expect(await screen.findByRole("button", { name: /^Peito\s*1 exercício/ })).toBeInTheDocument();
  });

  it("no Início, o voltar pergunta se quer sair; 'Continuar no app' mantém tudo e pergunta de novo no próximo voltar", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await screen.findByRole("heading", { name: "Treino A" });
    await voltar();
    const ask = await screen.findByRole("alertdialog", { name: "Sair do CG Fit?" });
    await user.click(within(ask).getByRole("button", { name: "Continuar no app" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Treino A" })).toBeInTheDocument();
    await voltar();
    expect(await screen.findByRole("alertdialog", { name: "Sair do CG Fit?" })).toBeInTheDocument();
    await voltar(); // voltar com a pergunta aberta equivale a "continuar no app"
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Treino A" })).toBeInTheDocument();
  });

  it("de outra aba o voltar leva ao Início sem perguntar nada", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Ajustes"));
    await voltar();
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("editando com mudanças, o voltar pergunta antes de descartar", async () => {
    const db = fresh(); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await tab("Treinos"));
    await user.click(await screen.findByRole("button", { name: "Editar Treino A" }));
    await user.click(await screen.findByRole("button", { name: "Remover Agachamento no Smith" }));
    await voltar();
    const ask = await screen.findByRole("alertdialog", { name: "Descartar alterações?" });
    expect(screen.getByRole("heading", { name: "Editar treino" })).toBeInTheDocument();
    await user.click(within(ask).getByRole("button", { name: "Descartar" }));
    expect(await screen.findByRole("button", { name: "Treinos" })).toHaveAttribute("aria-current", "page");
    expect((await db.workouts.get("A"))!.items.some((i) => i.exerciseId === "ds-0770")).toBe(true);
    await voltar();
    expect(await screen.findByRole("heading", { name: "Treino A" })).toBeInTheDocument(); // Início, e nada de pergunta sobrando
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
