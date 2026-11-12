import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchBar from "../SearchBar";

describe("SearchBar", () => {
  it("renders an accessible search input", () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole("searchbox", { name: /search tickets/i })).toBeInTheDocument();
  });

  it("passes the changed search text to its callback", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Login" } });
    expect(onChange).toHaveBeenCalledWith("Login");
  });
});
