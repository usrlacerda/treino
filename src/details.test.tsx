import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaLightbox } from "./components/MediaLightbox";
import { resetDetailsCache } from "./lib/details";

describe("detalhes do exercício", () => {
  beforeEach(() => { resetDetailsCache(); });
  afterEach(() => vi.unstubAllGlobals());

  it("mostra o passo a passo e os músculos que ajudam", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("catalog/info/0002.json")
      ? { ok: true, json: async () => ({ p: ["Deite-se no banco.", "Empurre a barra para cima."], s: ["tríceps", "ombros"] }) }
      : { ok: false }));
    render(<MediaLightbox id="ds-0002" name="Supino reto com barra" onClose={() => undefined} />);
    expect(await screen.findByRole("heading", { name: "Como fazer" })).toBeInTheDocument();
    expect(screen.getByText("Deite-se no banco.")).toBeInTheDocument();
    expect(screen.getByText(/tríceps, ombros/)).toBeInTheDocument();
  });

  it("sem detalhes (offline ou exercício próprio) mostra só a demonstração", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(<MediaLightbox id="ds-0003" name="Rosca" onClose={() => undefined} />);
    expect(await screen.findByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.queryByText("Como fazer")).toBeNull();
  });
});
