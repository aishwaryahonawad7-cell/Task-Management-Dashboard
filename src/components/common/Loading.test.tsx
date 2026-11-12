import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./Loading";

describe("Loading", () => {
  it("renders the loading indicator", () => {
    render(<Loading />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
