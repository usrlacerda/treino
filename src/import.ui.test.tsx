import "fake-indexeddb/auto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const fresh = () => new TreinoDB("imp-" + Math.random());
let created: Blob[] = [];
beforeEach(() => {
  created = [];
  URL.createObjectURL = vi.fn((b: Blob) => { created.push(b); return "blob:t"; });
  URL.revokeObjectURL = vi.fn();
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

const json = (o: object) => JSON.stringify({ app: "treino", kind: "plano", schema: 1, ...o });
const file = (t: string) => new File([t], "treinos.json", { type: "application/json" });
async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Importar treinos de um arquivo" }));
  await screen.findByRole("heading", { name: "Importar treinos" });
}
const sample = json({ workouts: [
  { name: "Treino A", items: [{ exerciseName: "Leg press", reps: "10-12" }] },
  { name: "Treino E", items: [{ exerciseName: "Remada nova", muscle: "costas" }] },
] });

describe("importar treinos: tela", () => {
  it("revisa, sugere novo nome para repetido, adiciona e avisa na Home", async () => {
    const db = fresh(); const user = userEvent.setup();
    render(<App db={db} />);
    await open(user);
    await user.upload(screen.getByLabelText(/Escolher arquivo de treinos/), file(sample));
    expect(await screen.findByRole("status")).toHaveTextContent(/2 treinos encontrados\. 1 exercício novo será criado\./);
    const names = screen.getAllByLabelText("Nome do treino") as HTMLInputElement[];
    expect(names.map((n) => n.value)).toEqual(["Treino A (2)", "Treino E"]);
    expect(screen.getByRole("heading", { name: "Exercícios novos" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Adicionar 2 treinos" }));
    expect(await screen.findByText("2 treinos adicionados.")).toBeInTheDocument();
    expect(await db.workouts.count()).toBe(5);
  });

  it("bloqueia nome repetido e permite desmarcar treino", async () => {
    const db = fresh(); const user = userEvent.setup();
    render(<App db={db} />);
    await open(user);
    await user.upload(screen.getByLabelText(/Escolher arquivo de treinos/), file(sample));
    const [first] = await screen.findAllByLabelText("Nome do treino");
    await user.clear(first); await user.type(first, "treino b");
    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um treino com esse nome.");
    expect(screen.getByRole("button", { name: "Adicionar 2 treinos" })).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "Importar “Treino A”" }));
    const btn = screen.getByRole("button", { name: "Adicionar 1 treino" });
    expect(btn).toBeEnabled();
    await user.click(screen.getByRole("checkbox", { name: "Importar “Treino E”" }));
    expect(screen.getByRole("button", { name: "Escolha um treino" })).toBeDisabled();
  });

  it("mostra erro claro para arquivo inválido e não altera nada", async () => {
    const db = fresh(); const user = userEvent.setup();
    render(<App db={db} />);
    await open(user);
    await user.upload(screen.getByLabelText(/Escolher arquivo de treinos/), file("oi"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/não é válido/);
    await user.upload(screen.getByLabelText(/Escolher arquivo de treinos/), file(json({ workouts: [{ name: "X", items: [{ exerciseName: "Inexistente" }] }] })));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Inexistente/);
    expect(await db.workouts.count()).toBe(3);
  });

  it("baixa o modelo e exporta os treinos; voltar não perde nada", async () => {
    const db = fresh(); const user = userEvent.setup();
    render(<App db={db} />);
    await open(user);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await user.click(screen.getByRole("button", { name: "Baixar modelo" }));
    await user.click(screen.getByRole("button", { name: "Exportar meus treinos" }));
    expect(created).toHaveLength(2);
    expect(JSON.parse(await created[1].text()).workouts).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByRole("button", { name: "Importar treinos de um arquivo" })).toBeInTheDocument();
    void within;
  });
});
