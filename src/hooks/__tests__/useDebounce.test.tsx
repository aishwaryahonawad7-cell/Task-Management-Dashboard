import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  afterEach(() => vi.useRealTimers());

  it("updates the value only after the delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: "a" } });
    rerender({ value: "login" });
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("login");
  });

  it("clears the previous timer when value changes quickly", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), { initialProps: { value: "a" } });
    rerender({ value: "old" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "latest" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("latest");
  });
});
