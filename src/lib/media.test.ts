import { existsSync } from "node:fs";
import { MEDIA_FRAMES } from "./media";
import { exercises } from "../db/seed";

describe("media", () => {
  it("todo exercício da biblioteca tem as ilustrações declaradas no disco", () => {
    for (const e of exercises) {
      const n = MEDIA_FRAMES[e.id];
      expect(n, e.id).toBeDefined();
      for (let i = 0; i < n; i++) expect(existsSync(`public/exercises/${e.id}/${i}.webp`), `${e.id}/${i}`).toBe(true);
    }
  });
});
