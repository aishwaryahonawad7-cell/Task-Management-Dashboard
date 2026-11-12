import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../services/authService", () => ({
  loginUser: vi.fn(async () => ({
    user: { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" },
    token: "auth-token",
  })),
}));

function AuthProbe() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return <div>
    <span>{isAuthenticated ? user?.email : "Signed out"}</span>
    <button onClick={() => void login("admin@example.com", "password")}>Login</button>
    <button onClick={logout}>Logout</button>
  </div>;
}

describe("AuthProvider", () => {
  it("restores the stored user", () => {
    sessionStorage.setItem("support_auth", JSON.stringify({ id: "1", name: "Saved", email: "saved@example.com", role: "ADMIN" }));
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(screen.getByText("saved@example.com")).toBeInTheDocument();
  });

  it("stores the user and access token on login and clears both on logout", async () => {
    sessionStorage.clear();
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() => expect(screen.getByText("admin@example.com")).toBeInTheDocument());
    expect(sessionStorage.getItem("token")).toBe("auth-token");
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(screen.getByText("Signed out")).toBeInTheDocument();
    expect(sessionStorage.getItem("support_auth")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});
