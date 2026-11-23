import "fake-indexeddb/auto";
import { act, render, screen, waitFor } from "@testing-library/react";
import { pressBack } from "./testBack";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { TreinoDB } from "./db/db";
import { App } from "./App";
import { setUpdateAvailable } from "./lib/updater";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

const fresh = () => new TreinoDB("audit-" + Math.random());
const CARGA = "Carga em kg, série 1, Agachamento no Smith";
const REPS = "Repetições (reps), série 1, Agachamento no Smith";
const CONCLUIR = { name: "Série 1 concluída, Agachamento no Smith" };

async function startA(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /^Treino A/ }));
  await screen.findByLabelText(CARGA);
}
async function logFirst(user: ReturnType<typeof userEvent.setup>, w: string, r: string) {
  await user.type(screen.getByLabelText(CARGA), w);
  await user.type(screen.getByLabelText(REPS), r);
  await user.click(screen.getByRole("button", CONCLUIR));
  await waitFor(() => expect(screen.getByRole("button", CONCLUIR)).toHaveAttribute("aria-pressed", "true"));
}

afterEach(() => vi.useRealTimers());

describe("auditoria: validação", () => {
  it("avisa o que falta ao concluir série vazia e limpa o aviso ao digitar", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} initialTab="treinos" />);
    await startA(user);
    await user.click(screen.getByRole("button", CONCLUIR));
    expect(await screen.findByRole("alert")).toHaveTextContent("Informe a carga e as repetições para concluir a série.");
    await user.type(screen.getByLabelText(CARGA), "40");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("aceita carga 0 digitada (sem peso) e vírgula decimal", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await startA(user);
    await logFirst(user, "42,5", "8");
    await waitFor(async () => expect((await db.sessions.toArray())[0].sets[0].weightKg).toBe(42.5));
  });
});

describe("auditoria: saída do treino", () => {
  it("Voltar com séries marcadas pergunta e salva ao confirmar, mostrando o resumo", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await startA(user);
    await logFirst(user, "50", "8");
    await pressBack();
    expect(await screen.findByRole("alertdialog", { name: "Sair do treino?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar e sair" }));
    expect(await screen.findByText("Treino salvo: 1 série, 400 kg de volume.")).toBeInTheDocument();
    expect(await screen.findByText("Próximo")).toBeInTheDocument();
    expect((await db.sessions.toArray())[0].finishedAt).toBeDefined();
  });
  it("Continuar treino fecha a pergunta e mantém tudo", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} initialTab="treinos" />);
    await startA(user);
    await logFirst(user, "50", "8");
    await pressBack();
    await user.click(await screen.findByRole("button", { name: "Continuar treino" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText(CARGA)).toHaveValue("50");
  });
  it("Voltar sem séries sai direto, sem pergunta e sem sessão", async () => {
    const db = fresh();
    const user = userEvent.setup();
    render(<App db={db} initialTab="treinos" />);
    await startA(user);
    await pressBack();
    expect(await screen.findByText("Próximo")).toBeInTheDocument();
    expect(await db.sessions.count()).toBe(0);
  });
  it("mostra a 'última vez' com vírgula e preenche o campo igual", async () => {
    const user = userEvent.setup();
    render(<App db={fresh()} initialTab="treinos" />);
    await startA(user);
    await logFirst(user, "42,5", "8");
    await user.click(screen.getByRole("button", { name: "Finalizar treino" }));
    await startA(user);
    expect(await screen.findByText("Última vez: 42,5 kg × 8")).toBeInTheDocument();
    expect(screen.getByLabelText(CARGA)).toHaveValue("42,5");
  });
});

describe("auditoria: falhas e atualização", () => {
  it("falha ao abrir o banco mostra mensagem e permite tentar de novo", async () => {
    let calls = 0;
    const real = fresh();
    const flaky = new Proxy(real, {
      get(t, p, r) {
        if (p === "workouts" && calls++ === 0) return { count: () => Promise.reject(new Error("bloqueado")) };
        return Reflect.get(t, p, r);
      },
    });
    const user = userEvent.setup();
    render(<App db={flaky} initialTab="treinos" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não conseguimos abrir seus dados neste navegador.");
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Treino A")).toBeInTheDocument();
  });
  it("versão nova aparece como aviso na tela inicial e só atualiza ao pedir", async () => {
    const apply = vi.fn();
    const user = userEvent.setup();
    render(<App db={fresh()} initialTab="treinos" />);
    await screen.findByText("Treino A");
    expect(screen.queryByText(/Nova versão disponível/)).not.toBeInTheDocument();
    act(() => setUpdateAvailable(apply));
    expect(await screen.findByText(/Nova versão disponível/)).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(apply).toHaveBeenCalledTimes(1);
  });
});

describe("auditoria: leitor de tela", () => {
  it("anuncia o fim do descanso", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    render(<App db={fresh()} initialTab="treinos" />);
    await startA(user);
    await logFirst(user, "40", "8");
    await screen.findByRole("timer");
    expect(screen.getByRole("status", { hidden: true, name: "" })).toBeDefined();
    await act(async () => { vi.advanceTimersByTime(91_000); });
    await waitFor(() => expect(screen.getAllByRole("status").some((e) => e.textContent === "Descanso terminou")).toBe(true));
  });
});
