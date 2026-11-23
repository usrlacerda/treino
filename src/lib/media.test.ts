import { existsSync } from "node:fs";
import { MEDIA_FRAMES } from "./media";
import { exercises } from "../db/seed";

describe("media", () => {
  it("todo exercício da biblioteca tem as ilustrações declaradas no disco", () => {
    for (const e of exercises) {
      expect(MEDIA_FRAMES[e.id], e.id).toBeDefined();
      expect(existsSync(`public/exercises/${e.id}/0.webp`), `${e.id}/0`).toBe(true);
      expect(existsSync(`public/exercises/${e.id}/anim.webp`), `${e.id}/anim`).toBe(true);
    }
  });
});
