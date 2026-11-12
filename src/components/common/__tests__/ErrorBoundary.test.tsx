import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

function BrokenChild(): React.ReactElement {
  throw new Error("render failed");
}

describe("ErrorBoundary", () => {
  it("shows a fallback and reports descendant render errors", () => {
    const onError = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary onError={onError}><BrokenChild /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(onError).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });

  it("supports a custom fallback", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary fallback={<p>Custom fallback</p>}><BrokenChild /></ErrorBoundary>);
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it("exposes a retry action in its fallback", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><BrokenChild /></ErrorBoundary>);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
