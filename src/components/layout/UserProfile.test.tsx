
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import UserProfile from "./UserProfile";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockLogout = vi.fn();
const mockLogin = vi.fn();

const adminUser = {
  id: "admin-1",
  name: "Admin User",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

// Reusable mock with all required AuthContextType properties
const mockUseAuth = (
  user: typeof adminUser | null
) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
  });
};

describe("UserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when there is no logged-in user", () => {
    mockUseAuth(null);

    const { container } = render(<UserProfile />);

    expect(container.firstChild).toBeNull();
  });

  it("displays the logged-in user's name and role", () => {
    mockUseAuth(adminUser);

    render(<UserProfile />);

    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Logout" })
    ).toBeInTheDocument();
  });

  it("calls logout when the Logout button is clicked", () => {
    mockUseAuth(adminUser);

    render(<UserProfile />);

    fireEvent.click(
      screen.getByRole("button", { name: "Logout" })
    );

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
