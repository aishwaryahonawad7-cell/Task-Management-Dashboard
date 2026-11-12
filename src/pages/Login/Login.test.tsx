
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Login from "./Login";

vi.mock("../../components/auth/LoginForm", () => ({
  default: () => <div>Login form rendered</div>,
}));

describe("Login page", () => {
  it("renders the LoginForm component", () => {
    render(<Login />);

    expect(
      screen.getByText("Login form rendered")
    ).toBeInTheDocument();
  });
});
