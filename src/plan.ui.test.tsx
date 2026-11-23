import "fake-indexeddb/auto";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { resetCatalogCache } from "./lib/catalog";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const fresh = () => new TreinoDB("plan-ui-" + Math.random());
const ROWS = [
  ["0313", "Rosca martelo", "biceps", "dumbbell", "biceps", "dumbbell hammer curl"],
  ["0126", "Rosca de punho com barra", "antebraco", "barbell", "forearms", "barbell wrist curl"],
];
beforeEach(() => {
  resetCatalogCache();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ROWS })));
});

async function openEditA(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Editar Treino A" }));
  await screen.findByRole("heading", { name: "Editar treino" });
}

describe("editar treino", () => {
  it("muda séries, reordena, remove e adiciona; o treino ativo reflete a mudança", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openEditA(user);

    const series = screen.getByLabelText("Séries, Agachamento no Smith");
    await user.clear(series); await user.type(series, "4");
    await user.click(screen.getByRole("button", { name: "Descer Agachamento no Smith" }));
    await user.click(screen.getByRole("button", { name: "Remover Abdominal na máquina" }));
    await user.click(screen.getByRole("button", { name: "Adicionar exercício" }));
    await user.click(await screen.findByRole("button", { name: /^Bíceps\s*1 exercício/ }));
    await user.click(await screen.findByRole("button", { name: "Adicionar Rosca martelo" }));
    expect(await screen.findByRole("heading", { name: "Editar treino" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Rosca martelo/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Treino A salvo.")).toBeInTheDocument();
    const w = (await db.workouts.get("A"))!;
    expect(w.items.map((i) => i.exerciseId).slice(0, 2)).toEqual(["ds-2330", "ds-0770"]);
    expect(w.items.find((i) => i.exerciseId === "ds-0770")?.sets).toBe(4);
    expect(w.items.some((i) => i.exerciseId === "ds-1452")).toBe(false);
    expect(w.items.some((i) => i.exerciseId === "ds-0313")).toBe(true);
    expect(await db.exercises.get("ds-0313")).toMatchObject({ name: "Rosca martelo", muscle: "biceps" });
    expect(w.items.at(-1)?.exerciseId).toBe("ds-0313");

    await user.click(await screen.findByText("Treino A"));
    expect(await screen.findByLabelText("Carga em kg, série 4, Agachamento no Smith")).toBeInTheDocument();
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s[0]).toMatch(/Puxada frontal aberta/);
    expect(h2s[1]).toMatch(/Agachamento no Smith/);
  });

  it("mostra o erro e não salva quando o mínimo de repetições passa do máximo", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openEditA(user);
    const min = screen.getByLabelText("Mínimo de repetições, Abdominal na máquina");
    await user.clear(min); await user.type(min, "20");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("o mínimo de repetições não pode ser maior que o máximo");
    expect((await db.workouts.get("A"))!.items[0].repMin).toBe(12);
  });

  it("Cancelar descarta as mudanças", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openEditA(user);
    await user.click(screen.getByRole("button", { name: "Remover Agachamento no Smith" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Escolha o treino de hoje")).toBeInTheDocument();
    expect((await db.workouts.get("A"))!.items[0].exerciseId).toBe("ds-1452");
  });

  it("cardio edita a duração", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openEditA(user);
    const d = screen.getByLabelText("Duração em minutos, Esteira inclinada");
    await user.clear(d); await user.type(d, "20");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText("Treino A salvo.");
    expect((await db.workouts.get("A"))!.items.at(-1)?.durationMin).toBe(20);
  });
});

describe("escolher exercício ao editar o treino", () => {
  it("esconde o que já está no treino e permite cancelar", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await openEditA(user);
    await user.click(screen.getByRole("button", { name: "Adicionar exercício" }));
    await screen.findByRole("heading", { name: "Escolher exercício" });
    await user.type(screen.getByLabelText("Buscar exercício"), "martelo");
    expect(await screen.findByText("Rosca martelo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("heading", { name: "Editar treino" })).toBeInTheDocument();
  });
});

describe("novo treino", () => {
  it("cria um treino do zero pelo botão Novo treino", async () => {
    const db = new TreinoDB("nt-" + Math.random()); await seedIfEmpty(db);
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByRole("button", { name: "Novo treino" }));
    expect(await screen.findByRole("heading", { name: "Novo treino" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome do treino"), "Treino D");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("O treino precisa de pelo menos 1 exercício.")).toBeInTheDocument();
    expect(await db.workouts.count()).toBe(3);
  });
});
