import { formatClock, remainingSec } from "./time";

describe("time", () => {
  it("arredonda o restante para cima e nunca fica negativo", () => {
    expect(remainingSec(10_000, 8_001)).toBe(2);
    expect(remainingSec(10_000, 10_000)).toBe(0);
    expect(remainingSec(10_000, 20_000)).toBe(0);
  });
  it("formata m:ss", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(-3)).toBe("0:00");
  });
});
