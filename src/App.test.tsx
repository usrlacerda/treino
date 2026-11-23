import "fake-indexeddb/auto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TreinoDB } from "./db/db";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

const fresh = () => new TreinoDB("app-" + Math.random());

describe("App", () => {
  it("mostra os treinos e sugere o A na primeira vez", async () => {
    render(<App db={fresh()} />);
    expect(await screen.findByRole("heading", { name: "Treino" })).toBeInTheDocument();
    expect(await screen.findByText("Treino A")).toBeInTheDocument();
    expect(await screen.findByText("Próximo")).toBeInTheDocument();
  });

  it("registra uma série, grava no banco e mostra 'última vez' no treino seguinte", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByText("Treino A"));

    await user.type(await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith"), "40");
    await user.type(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith"), "8");
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));

    await waitFor(async () => {
      const s = await db.sessions.toArray();
      expect(s[0].sets).toEqual([expect.objectContaining({ exerciseId: "agach-smith", setIndex: 0, weightKg: 40, reps: 8 })]);
    });

    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    expect(await screen.findByText("Próximo")).toBeInTheDocument();
    await user.click(await screen.findByText("Treino A"));
    expect(await screen.findByText("Última vez: 40 kg × 8")).toBeInTheDocument();
  });

  it("inicia o descanso ao concluir série (50s no agachamento) e permite pular", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await user.click(await screen.findByText("Treino A"));
    await user.type(await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith"), "40");
    await user.type(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith"), "8");
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));
    const timer = await screen.findByRole("timer");
    expect(timer).toHaveTextContent("Descanso · Agachamento no Smith");
    expect(timer).toHaveTextContent("0:50");
    await user.click(screen.getByRole("button", { name: "Pular" }));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("sair sem registrar nada não cria sessão", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByText("Treino A"));
    await user.click(await screen.findByRole("button", { name: "Finalizar treino" }));
    expect(await screen.findByText("Próximo")).toBeInTheDocument();
    expect(await db.sessions.count()).toBe(0);
  });

  it("histórico mostra recorde, gráfico e treino feito depois de finalizar", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await user.click(await screen.findByText("Treino A"));
    await user.type(await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith"), "50");
    await user.type(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith"), "8");
    await user.click(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));
    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    await user.click(await screen.findByRole("button", { name: "Histórico" }));
    expect(await screen.findByText("50 kg × 8")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Agachamento no Smith: de 50 kg para 50 kg em 1 treino/ })).toBeInTheDocument();
    expect(screen.getByText(/1 série · volume 400 kg/)).toBeInTheDocument();
  });

  it("mostra a demonstração animada do exercício", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} />);
    await user.click(await screen.findByText("Treino A"));
    const demo = await screen.findByAltText("Agachamento no Smith: demonstração do movimento");
    expect(demo).toHaveAttribute("src", "/exercises/agach-smith/anim.webp");
  });

  it("não registra série com repetições vazias", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} />);
    await user.click(await screen.findByText("Treino A"));
    await user.click(await screen.findByRole("button", { name: "Série 1 concluída, Agachamento no Smith" }));
    expect(await db.sessions.count()).toBe(0);
  });
});
