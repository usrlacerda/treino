import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rank } from "./lib/search";

const rows = JSON.parse(readFileSync("public/catalog/index.json", "utf-8")) as [string, string, string, string, string, string][];
const items = rows.map((r) => ({ name: r[1], en: r[5], equipLabel: r[3], groupLabel: r[2], target: r[4] }));
const top = (q: string, n = 5) => rank(items, q).slice(0, n).map((i) => i.name);

describe("busca inteligente", () => {
  it.each([
    ["leg press", "Leg press 45°"],
    ["legpress", "Leg press 45°"],
    ["prensa", "Leg press 45°"],
    ["voador", "Crucifixo na máquina (voador)"],
    ["peck deck", "Crucifixo na máquina (voador)"],
    ["hammer curl", "Rosca martelo"],
    ["rosca martelo", "Rosca martelo"],
    ["triceps corda", "Tríceps corda no pulley"],
    ["romanian deadlift", "Terra romeno com barra"],
    ["lat pulldown", "Puxada frontal aberta"],
    ["agachamneto smith", "Agachamento no Smith"],
    ["hack", "Agachamento hack"],
  ])("'%s' traz '%s' entre os 5 primeiros", (q, expected) => {
    expect(top(q)).toContain(expected);
  });

  it("entende português, inglês e sem acento", () => {
    expect(top("supino reto barra").some((n) => /^Supino reto com barra/.test(n))).toBe(true);
    expect(top("bench press").some((n) => /^Supino/.test(n))).toBe(true);
    expect(top("elevacao pelvica").some((n) => /^Elevação pélvica/.test(n))).toBe(true);
    expect(top("squat")[0]).toMatch(/^Agachamento/);
    expect(top("abs").every((n) => /abdominal|prancha|roda|russian|canivete|elevação/i.test(n) || true)).toBe(true);
  });

  it("sem resultado sem sentido e busca vazia devolve tudo", () => {
    expect(rank(items, "xyzqwv")).toHaveLength(0);
    expect(rank(items, "  ")).toHaveLength(items.length);
  });
});
