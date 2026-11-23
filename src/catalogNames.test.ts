import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const rows = JSON.parse(readFileSync("public/catalog/index.json", "utf-8")) as [string, string, string, string, string, string][];

describe("nomes do catálogo (padrão de academia no Brasil)", () => {
  it("todos começam com maiúscula e não têm resíduos do original", () => {
    for (const [id, name] of rows) {
      expect(name[0], id).toBe(name[0].toUpperCase());
      expect(name, id).not.toMatch(/\((male|female)\)|\bv\. \d|\s{2,}|\s$/i);
    }
  });
  it("não há nomes repetidos", () => {
    const names = rows.map((r) => r[1].toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
  it("guarda o nome original em inglês para a busca", () => {
    expect(rows.every((r) => r[5] && r[5] !== r[1])).toBe(true);
  });
  it("não sobram palavras comuns em inglês nos nomes", () => {
    const bad = rows.filter((r) => /\b(dumbbell|barbell|cable|curl|raise|squat|stretch|with|on the)\b/i.test(r[1]));
    expect(bad.map((r) => `${r[0]} ${r[1]}`)).toEqual([]);
  });
});
