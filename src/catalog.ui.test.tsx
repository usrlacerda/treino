import "fake-indexeddb/auto";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";
import { TreinoDB, seedIfEmpty } from "./db/db";
import { exportData, importBackup, parseBackup } from "./db/backup";
import { deleteExercise } from "./db/plan";
import { App } from "./App";
import { animSrc, mediaSrc } from "./lib/media";
import { ExerciseMedia } from "./components/ExerciseMedia";
import { resetCatalogCache, toExercise, toItem } from "./lib/catalog";

vi.mock("./lib/alert", () => ({ notifyRestOver: vi.fn(), primeAudio: vi.fn() }));
const ROWS = [
  ["0001", "Abdominal 3/4", "abdomen", "body weight", "abs", "3/4 sit-up"],
  ["0002", "Supino reto com barra", "peito", "barbell", "pectorals", "barbell bench press"],
  ["0003", "Rosca direta com halteres", "biceps", "dumbbell", "biceps", "dumbbell curl"],
  ["0004", "Supino inclinado com halteres", "peito", "dumbbell", "pectorals", "dumbbell incline bench press"],
];
const fresh = () => new TreinoDB("cat-" + Math.random());

beforeEach(() => {
  resetCatalogCache();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ROWS })));
});

async function openLibrary(user: ReturnType<typeof userEvent.setup>) {
  const db = fresh(); await seedIfEmpty(db);
  render(<App db={db} />);
  await user.click(await screen.findByRole("button", { name: "Biblioteca" }));
  await screen.findByRole("heading", { name: "Biblioteca" });
  return db;
}

describe("biblioteca única", () => {
  it("mostra os grupos com a contagem de exercícios", async () => {
    const user = userEvent.setup();
    await openLibrary(user);
    expect(await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Abdômen\s*1 exercício/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pernas\s*0 exercícios/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Explorar catálogo|Novo exercício/ })).not.toBeInTheDocument();
  });

  it("abre um grupo e filtra por equipamento", async () => {
    const user = userEvent.setup();
    await openLibrary(user);
    await user.click(await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ }));
    expect(await screen.findByRole("heading", { name: "Peito" })).toBeInTheDocument();
    expect(screen.getByText("Supino reto com barra")).toBeInTheDocument();
    await user.click(within(screen.getByRole("group", { name: "Filtrar por equipamento" })).getByRole("button", { name: "Halteres" }));
    expect(screen.getByText("1 exercício")).toBeInTheDocument();
    expect(screen.queryByText("Supino reto com barra")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(await screen.findByRole("button", { name: /^Costas\s*0 exercícios/ })).toBeInTheDocument();
  });

  it("busca sem acento, em português ou em inglês, em todos os grupos", async () => {
    const user = userEvent.setup();
    await openLibrary(user);
    await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ });
    await user.type(screen.getByLabelText("Buscar exercício"), "ABDOMINAL");
    expect(await screen.findByText("Abdominal 3/4")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Buscar exercício"));
    await user.type(screen.getByLabelText("Buscar exercício"), "dumbbell curl");
    expect(await screen.findByText("Rosca direta com halteres")).toBeInTheDocument();
    expect(screen.getByText("1 exercício")).toBeInTheDocument();
  });

  it("adiciona o exercício a um treino que já existe e vai para a tela de Treinos", async () => {
    const user = userEvent.setup();
    const db = await openLibrary(user);
    await user.click(await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ }));
    await user.click(await screen.findByText("Supino reto com barra"));
    await user.click(await screen.findByRole("button", { name: "Adicionar a um treino" }));
    expect(await screen.findByRole("dialog", { name: "Adicionar a um treino" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Adicionar ao Treino A" }));
    expect(await screen.findByText("Supino reto com barra foi adicionado ao Treino A.")).toBeInTheDocument();
    expect(await screen.findByText("Escolha o treino de hoje")).toBeInTheDocument();
    const a = (await db.workouts.get("A"))!;
    expect(a.items.at(-1)).toMatchObject({ exerciseId: "ds-0002", sets: 3, repMin: 8, repMax: 12, restSec: 60 });
    expect(await db.exercises.get("ds-0002")).toBeDefined();
  });

  it("não deixa adicionar de novo o exercício que o treino já tem", async () => {
    const user = userEvent.setup();
    const db = await openLibrary(user);
    await db.workouts.put({ ...(await db.workouts.get("A"))!, items: [{ exerciseId: "ds-0002", sets: 3, repMin: 8, repMax: 12, restSec: 60 }] });
    await user.click(await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ }));
    await user.click(await screen.findByText("Supino reto com barra"));
    await user.click(await screen.findByRole("button", { name: "Adicionar a um treino" }));
    expect(await screen.findByRole("button", { name: "Treino A, já tem este exercício" })).toBeDisabled();
  });

  it("cria um treino novo já começando pelo exercício", async () => {
    const user = userEvent.setup();
    const db = await openLibrary(user);
    await user.click(await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ }));
    await user.click(await screen.findByText("Supino reto com barra"));
    await user.click(await screen.findByRole("button", { name: "Adicionar a um treino" }));
    await user.click(await screen.findByRole("button", { name: "Criar treino novo com este exercício" }));
    expect(await screen.findByRole("heading", { name: "Novo treino" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Supino reto com barra" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome do treino"), "Peito extra");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Peito extra salvo.")).toBeInTheDocument();
    const all = await db.workouts.toArray();
    expect(all).toHaveLength(4);
    expect(all.find((w) => w.name === "Peito extra")!.items.map((i) => i.exerciseId)).toEqual(["ds-0002"]);
  });

  it("avisa quando os exercícios não carregam e mostra o que está salvo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    const user = userEvent.setup();
    await openLibrary(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não conseguimos carregar todos os exercícios");
    expect(await screen.findByRole("button", { name: /^Peito\s*3 exercícios/ })).toBeInTheDocument();
  });

  it("não tem como criar exercício na biblioteca", async () => {
    const user = userEvent.setup();
    await openLibrary(user);
    await screen.findByRole("button", { name: /^Peito\s*2 exercícios/ });
    expect(screen.queryByText(/Novo exercício/)).not.toBeInTheDocument();
  });
});

describe("exercícios do catálogo no banco", () => {
  it("usa miniatura própria, entra no backup e pode ser removido", async () => {
    const db = fresh(); await seedIfEmpty(db);
    expect(mediaSrc("ds-0002")).toContain("catalog/img/0002.webp");
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

describe("animação do exercício", () => {
  it("mostra a demonstração animada de exercícios do catálogo", () => {
    expect(animSrc("ds-0002")).toContain("catalog/anim/0002.webp");
    render(<ExerciseMedia id="ds-0002" name="barbell bench press" />);
    expect(screen.getByAltText("barbell bench press: demonstração do movimento")).toHaveAttribute("src", expect.stringContaining("anim/0002.webp"));
  });
  it("amplia a demonstração ao tocar na miniatura e fecha", async () => {
    const user = userEvent.setup();
    await openLibrary(user);
    await user.click(await screen.findByRole("button", { name: /^Bíceps\s*1 exercício/ }));
    await user.click(await screen.findByRole("button", { name: "Ampliar demonstração de Rosca direta com halteres" }));
    const dlg = screen.getByRole("dialog", { name: "Rosca direta com halteres" });
    expect(within(dlg).getByRole("img", { name: /Rosca direta com halteres/ })).toBeInTheDocument();
    await user.click(within(dlg).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
