import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TreinoDB } from "./db/db";
import { resetCatalogCache } from "./lib/catalog";
import { syncCatalogNames } from "./lib/syncNames";

describe("nomes do catálogo nos exercícios salvos", () => {
  beforeEach(() => {
    resetCatalogCache();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => [["1463", "Leg press 45°", "quadriceps", "leverage machine", "glutes", "sled 45° leg press"]] })));
  });
  it("atualiza só o que mudou e deixa exercícios próprios em paz", async () => {
    const db = new TreinoDB("sn-" + Math.random());
    await db.exercises.bulkPut([
      { id: "ds-1463", name: "Leg press", muscle: "gluteos", equipment: "Máquina", cue: "x" },
      { id: "custom-a", name: "Meu", muscle: "peito", equipment: "", cue: "" },
    ]);
    expect(await syncCatalogNames(db)).toBe(1);
    expect(await db.exercises.get("ds-1463")).toMatchObject({ name: "Leg press 45°", muscle: "quadriceps", cue: "x" });
    expect((await db.exercises.get("custom-a"))!.name).toBe("Meu");
    expect(await syncCatalogNames(db)).toBe(0);
  });
});
