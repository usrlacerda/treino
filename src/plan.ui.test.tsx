import "fake-indexeddb/auto";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TreinoDB } from "./db/db";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const fresh = () => new TreinoDB("plan-ui-" + Math.random());

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
    await user.click(screen.getByRole("button", { name: "Remover Abdominal crunch na máquina" }));
    await user.selectOptions(screen.getByLabelText("Adicionar exercício"), "Rosca martelo");
    await user.click(screen.getByRole("button", { name: "Adicionar ao treino" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Treino A salvo.")).toBeInTheDocument();
    const w = (await db.workouts.get("A"))!;
    expect(w.items.map((i) => i.exerciseId).slice(0, 2)).toEqual(["puxada-aberta", "agach-smith"]);
    expect(w.items.find((i) => i.exerciseId === "agach-smith")?.sets).toBe(4);
    expect(w.items.some((i) => i.exerciseId === "abd-maquina")).toBe(false);
    expect(w.items.at(-1)?.exerciseId).toBe("rosca-martelo");

    await user.click(await screen.findByText("Treino A"));
    expect(await screen.findByLabelText("Carga em kg, série 4, Agachamento no Smith")).toBeInTheDocument();
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s[0]).toMatch(/1\. Puxada frontal aberta/);
    expect(h2s[1]).toMatch(/2\. Agachamento no Smith/);
  });

  it("mostra o erro e não salva quando o mínimo de repetições passa do máximo", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openEditA(user);
    const min = screen.getByLabelText("Mínimo de repetições, Abdominal crunch na máquina");
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
    expect(await screen.findByText("Escolha o treino de hoje.")).toBeInTheDocument();
    expect((await db.workouts.get("A"))!.items[0].exerciseId).toBe("abd-maquina");
  });

  it("cardio edita a duração", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openEditA(user);
    const d = screen.getByLabelText("Duração em minutos, Cardio (esteira, bike ou elíptico)");
    await user.clear(d); await user.type(d, "20");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText("Treino A salvo.");
    expect((await db.workouts.get("A"))!.items.at(-1)?.durationMin).toBe(20);
  });
});

describe("biblioteca", () => {
  async function openLib(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole("button", { name: "Biblioteca" }));
    await screen.findByRole("heading", { name: "Biblioteca" });
  }

  it("busca sem acento e filtra por grupo muscular", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await openLib(user);
    expect(await screen.findByText("24 exercícios")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Buscar exercício"), "elevacao");
    expect(screen.getByText("Elevação lateral com halteres")).toBeInTheDocument();
    expect(screen.getByText("Elevação pélvica")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Buscar exercício"));
    await user.click(screen.getByRole("button", { name: "Peito" }));
    expect(screen.getByText("3 exercícios")).toBeInTheDocument();
    expect(screen.queryByText("Leg press")).not.toBeInTheDocument();
  });

  it("cria exercício próprio, mostra 'Próprio', e apaga com confirmação", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openLib(user);
    await user.click(await screen.findByRole("button", { name: "Novo exercício" }));
    const form = screen.getByRole("form", { name: "Novo exercício" });
    await user.type(within(form).getByLabelText("Nome"), "Remada curvada");
    await user.click(within(form).getByRole("button", { name: "Salvar exercício" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escolha o grupo muscular.");
    await user.selectOptions(within(form).getByLabelText("Grupo muscular"), "Costas");
    await user.click(within(form).getByRole("button", { name: "Salvar exercício" }));
    expect(await screen.findByText("Remada curvada")).toBeInTheDocument();
    expect(screen.getByText("Próprio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Apagar Remada curvada" }));
    await user.click(await screen.findByRole("button", { name: "Apagar exercício" }));
    await waitFor(() => expect(screen.queryByText("Remada curvada")).not.toBeInTheDocument());
  });

  it("exercício próprio usado em treino não pode ser apagado e mostra o motivo", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await openLib(user);
    await user.click(await screen.findByRole("button", { name: "Novo exercício" }));
    await user.type(screen.getByLabelText("Nome"), "Prancha lateral");
    await user.selectOptions(screen.getByLabelText("Grupo muscular"), "Abdômen");
    await user.click(screen.getByRole("button", { name: "Salvar exercício" }));
    await screen.findByText("Prancha lateral");

    await user.click(screen.getByRole("button", { name: "Treinos" }));
    await openEditA(user);
    await user.selectOptions(screen.getByLabelText("Adicionar exercício"), "Prancha lateral");
    await user.click(screen.getByRole("button", { name: "Adicionar ao treino" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText("Treino A salvo.");

    await openLib(user);
    await user.click(await screen.findByRole("button", { name: "Apagar Prancha lateral" }));
    await user.click(await screen.findByRole("button", { name: "Apagar exercício" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Este exercício está em um treino.");
    expect(screen.getByText("Prancha lateral")).toBeInTheDocument();
  });
});
