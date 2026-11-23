import { existsSync } from "node:fs";
import { exercises } from "../db/seed";
import { animSrc, hasAnim, mediaSrc } from "./media";

describe("media", () => {
  it("todo exercício do protocolo vem do catálogo e tem miniatura e animação no disco", () => {
    for (const e of exercises) {
      expect(hasAnim(e.id), e.id).toBe(true);
      expect(existsSync(`public/catalog/img/${e.id.slice(3)}.webp`), `${e.id} miniatura`).toBe(true);
      expect(existsSync(`public/catalog/anim/${e.id.slice(3)}.webp`), `${e.id} animação`).toBe(true);
    }
  });
  it("monta os caminhos relativos à base do app", () => {
    expect(mediaSrc("ds-0002")).toContain("catalog/img/0002.webp");
    expect(animSrc("ds-0002")).toContain("catalog/anim/0002.webp");
    expect(hasAnim("custom-x")).toBe(false);
  });
});
