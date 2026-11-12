
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./routes/AppRoutes", () => ({
  default: () => <div>App routes rendered</div>,
}));

describe("App", () => {
  it("renders the application routes inside the app", () => {
    render(<App />);

    expect(
      screen.getByText("App routes rendered")
    ).toBeInTheDocument();
  });
});
