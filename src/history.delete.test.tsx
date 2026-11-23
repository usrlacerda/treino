import "fake-indexeddb/auto";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { finishSession, logSet, startSession } from "./db/repo";
import { History } from "./screens/History";

async function withSession() {
  const db = new TreinoDB("hd-" + Math.random()); await seedIfEmpty(db);
  const id = await startSession(db, "A");
  await logSet(db, id, { exerciseId: "ds-0770", setIndex: 0, weightKg: 40, reps: 10, doneAt: Date.now() });
  await finishSession(db, id);
  return { db, id };
}
const del = () => screen.findByRole("button", { name: /^Excluir treino Treino A/ });

describe("excluir treino do histórico", () => {
  it("pergunta antes; cancelar mantém o treino", async () => {
    const { db } = await withSession();
    const user = userEvent.setup();
    render(<History db={db} />);
    await user.click(await del());
    const ask = await screen.findByRole("alertdialog", { name: "Excluir este treino?" });
    await user.click(within(ask).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(await db.sessions.count()).toBe(1);
  });

  it("confirmar exclui, mostra o aviso e 'Desfazer' traz o treino de volta", async () => {
    const { db, id } = await withSession();
    const user = userEvent.setup();
    render(<History db={db} />);
    await user.click(await del());
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir treino" }));
    expect(await screen.findByText("Treino excluído.")).toBeInTheDocument();
    expect(await db.sessions.count()).toBe(0);
    expect(await screen.findByText("Nenhum treino finalizado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(await del()).toBeInTheDocument();
    const back = await db.sessions.get(id);
    expect(back?.finishedAt).toBeDefined();
    expect(back?.sets).toHaveLength(1);
    expect(screen.queryByText("Treino excluído.")).not.toBeInTheDocument();
  });
});
