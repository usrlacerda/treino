import { fmtNum, plural } from "./format";

describe("format", () => {
  it("plural em português", () => {
    expect(plural(1, "série", "séries")).toBe("1 série");
    expect(plural(0, "série", "séries")).toBe("0 séries");
    expect(plural(12, "série", "séries")).toBe("12 séries");
  });
  it("números com vírgula decimal e até 2 casas", () => {
    expect(fmtNum(42.5)).toBe("42,5");
    expect(fmtNum(42.25)).toBe("42,25");
    expect(fmtNum(1175)).toBe("1.175");
  });
});
