import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../../context/AuthContext";
import LoginForm from "../LoginForm";

vi.mock("../../../services/authService", () => ({
  loginUser: vi.fn(async (email: string) => ({
    user: { id: "1", name: "Admin User", email, role: "ADMIN" },
    token: "test-token",
  })),
}));

function renderLogin() {
  return render(<BrowserRouter><AuthProvider><LoginForm /></AuthProvider></BrowserRouter>);
}

describe("LoginForm", () => {
  beforeEach(() => sessionStorage.clear());

  it("renders email and password fields", () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("shows validation for malformed email", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid email/i);
  });

  it("logs in and stores the authenticated user", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "admin123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(sessionStorage.getItem("support_auth")).toContain("admin@example.com"));
    expect(sessionStorage.getItem("token")).toBe("test-token");
  });
});
