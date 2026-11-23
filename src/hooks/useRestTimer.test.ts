import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { useRestTimer } from "./useRestTimer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useRestTimer", () => {
  it("conta regressivamente e avisa uma única vez no fim", () => {
    const done = vi.fn();
    const { result } = renderHook(() => useRestTimer(done));
    act(() => result.current.start(60, "Agachamento"));
    expect(result.current.active).toBe(true);
    expect(result.current.remaining).toBe(60);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(result.current.remaining).toBe(30);
    expect(done).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(31_000); });
    expect(done).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(false);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(done).toHaveBeenCalledTimes(1);
  });
  it("+15s e -15s ajustam o tempo", () => {
    const { result } = renderHook(() => useRestTimer(() => undefined));
    act(() => result.current.start(60, "x"));
    act(() => result.current.adjust(15));
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.remaining).toBe(75);
    act(() => result.current.adjust(-30));
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.remaining).toBe(45);
  });
  it("pular encerra sem avisar", () => {
    const done = vi.fn();
    const { result } = renderHook(() => useRestTimer(done));
    act(() => result.current.start(60, "x"));
    act(() => result.current.skip());
    expect(result.current.active).toBe(false);
    act(() => { vi.advanceTimersByTime(70_000); });
    expect(done).not.toHaveBeenCalled();
  });
  it("tempo zero não inicia", () => {
    const { result } = renderHook(() => useRestTimer(() => undefined));
    act(() => result.current.start(0, "x"));
    expect(result.current.active).toBe(false);
  });
});
