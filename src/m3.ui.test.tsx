import "fake-indexeddb/auto";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TreinoDB } from "./db/db";
import { App } from "./App";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));

describe("ajustes finais", () => {
  it("histórico vazio leva aos Treinos", async () => {
    const user = userEvent.setup();
    render(<App db={new TreinoDB("m3-" + Math.random())} />);
    await user.click(await screen.findByRole("button", { name: "Histórico" }));
    await user.click(await screen.findByRole("button", { name: "Ir para Treinos" }));
    expect(await screen.findByRole("button", { name: /^Treino A/ })).toBeInTheDocument();
  });
  it("botão da série mantém o nome e alterna aria-pressed; timer mostra progresso", async () => {
    const user = userEvent.setup();
    render(<App db={new TreinoDB("m3b-" + Math.random())} />);
    await user.click(await screen.findByText("Treino A"));
    await user.type(await screen.findByLabelText("Carga em kg, série 1, Agachamento no Smith"), "40");
    await user.type(screen.getByLabelText("Repetições (reps), série 1, Agachamento no Smith"), "8");
    const btn = screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    await user.click(btn);
    await waitFor(() => expect(screen.getByRole("button", { name: "Série 1 concluída, Agachamento no Smith" })).toHaveAttribute("aria-pressed", "true"));
    const timer = await screen.findByRole("timer");
    expect(timer.querySelector(".rest-bar div")).toHaveStyle({ width: "100%" });
  });
  it("a barra de navegação tem 4 destinos com ícones decorativos", async () => {
    render(<App db={new TreinoDB("m3c-" + Math.random())} />);
    const nav = await screen.findByRole("navigation", { name: "Navegação" });
    expect(nav.querySelectorAll("button")).toHaveLength(4);
    expect(nav.querySelectorAll("svg[aria-hidden='true']")).toHaveLength(4);
  });
});
