import "fake-indexeddb/auto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { exportData, importBackup, parseBackup } from "./db/backup";
import { deleteExercise } from "./db/plan";
import { App } from "./App";
import { mediaSrc } from "./lib/media";
import { resetCatalogCache, toExercise, toItem } from "./lib/catalog";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const ROWS = [
  ["0001", "3/4 sit-up", "abdomen", "body weight", "abs"],
  ["0002", "barbell bench press", "peito", "barbell", "pectorals"],
  ["0003", "dumbbell curl", "biceps", "dumbbell", "biceps"],
];
const fresh = () => new TreinoDB("cat-" + Math.random());

beforeEach(() => {
  resetCatalogCache();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ROWS })));
});

async function openCatalog(user: ReturnType<typeof userEvent.setup>) {
  const db = fresh(); await seedIfEmpty(db);
  render(<App db={db} />);
  await user.click(await screen.findByRole("button", { name: "Biblioteca" }));
  await user.click(await screen.findByRole("button", { name: /Explorar catálogo/ }));
  await screen.findByRole("heading", { name: "Catálogo de exercícios" });
  return db;
}

describe("catálogo de exercícios", () => {
  it("busca sem acento, filtra e adiciona à biblioteca", async () => {
    const user = userEvent.setup();
    const db = await openCatalog(user);
    expect(await screen.findByText("3 exercícios")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Buscar no catálogo"), "BENCH");
    expect(await screen.findByText("1 exercício")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Adicionar barbell bench press" }));
    expect(await screen.findByText("Na biblioteca")).toBeInTheDocument();
    const ex = await db.exercises.get("ds-0002");
    expect(ex).toMatchObject({ name: "barbell bench press", muscle: "peito", equipment: "Barra" });
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByText("barbell bench press")).toBeInTheDocument();
  });

  it("filtra por grupo muscular", async () => {
    const user = userEvent.setup();
    await openCatalog(user);
    await screen.findByText("3 exercícios");
    await user.click(within(screen.getByRole("group", { name: "Filtrar por grupo muscular" })).getByRole("button", { name: "Bíceps" }));
    expect(await screen.findByText("1 exercício")).toBeInTheDocument();
    expect(screen.getByText("dumbbell curl")).toBeInTheDocument();
  });

  it("avisa quando o catálogo não carrega", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    const user = userEvent.setup();
    await openCatalog(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o catálogo");
  });
});

describe("exercícios do catálogo no banco", () => {
  it("usa miniatura própria, entra no backup e pode ser removido", async () => {
    const db = fresh(); await seedIfEmpty(db);
    expect(mediaSrc("ds-0002", 0)).toContain("catalog/img/0002.webp");
    await db.exercises.put(toExercise(toItem(ROWS[1] as never)));
    const backup = await exportData(db);
    expect(backup.exercises.map((e) => e.id)).toContain("ds-0002");
    const db2 = fresh(); await seedIfEmpty(db2);
    await importBackup(db2, parseBackup(JSON.parse(JSON.stringify(backup))));
    expect(await db2.exercises.get("ds-0002")).toBeTruthy();
    await deleteExercise(db2, "ds-0002");
    expect(await db2.exercises.get("ds-0002")).toBeUndefined();
  });
});
