
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext";
import AppRoutes from "../AppRoutes";

// Mock Login page
vi.mock("../../pages/Login/Login", () => ({
  default: () => <p>Login page</p>,
}));

// Mock Unauthorized page
vi.mock("../../pages/Unauthorized/Unauthorized", () => ({
  default: () => <p>Unauthorized page</p>,
}));

// Mock Ticket Dashboard
vi.mock("../../pages/TicketDashboard/TicketDashboard", () => ({
  default: () => <p>Ticket dashboard page</p>,
}));

// Test users
const users = {
  ADMIN: {
    id: "admin-1",
    name: "Admin",
    email: "admin@example.com",
    role: "ADMIN" as const,
  },

  MANAGER: {
    id: "manager-1",
    name: "Manager",
    email: "manager@example.com",
    role: "MANAGER" as const,
  },

  AGENT: {
    id: "agent-1",
    name: "Agent",
    email: "agent@example.com",
    role: "AGENT" as const,
  },
};

// Common render function
const renderRoutes = (
  path: string,
  role: keyof typeof users | null = null
) => {
  if (role) {
    sessionStorage.setItem(
      "support_auth",
      JSON.stringify(users[role])
    );
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("AppRoutes", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  // Login route tests

  it("displays login page for unauthenticated users", () => {
    renderRoutes("/login");

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();
  });

  it("redirects authenticated users away from login", () => {
    renderRoutes("/login", "ADMIN");

    expect(
      screen.getByText("Ticket dashboard page")
    ).toBeInTheDocument();
  });

  // Dashboard route tests

  it("displays dashboard for authenticated users", () => {
    renderRoutes("/dashboard", "AGENT");

    expect(
      screen.getByText("Ticket dashboard page")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users from dashboard to login", () => {
    renderRoutes("/dashboard");

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();
  });

  // Admin route tests

  it("allows Admin to access admin page", () => {
    renderRoutes("/admin", "ADMIN");

    expect(
      screen.getByText("Administration Dashboard")
    ).toBeInTheDocument();
  });

  it("redirects Manager from admin page to unauthorized", () => {
    renderRoutes("/admin", "MANAGER");

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();
  });

  it("redirects Agent from admin page to unauthorized", () => {
    renderRoutes("/admin", "AGENT");

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users from admin page to login", () => {
    renderRoutes("/admin");

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();
  });

  // Team statistics route tests

  it("allows Manager to access team statistics", () => {
    renderRoutes("/team-statistics", "MANAGER");

    expect(
      screen.getByText("Team Statistics")
    ).toBeInTheDocument();
  });

  it("allows Admin to access team statistics", () => {
    renderRoutes("/team-statistics", "ADMIN");

    expect(
      screen.getByText("Team Statistics")
    ).toBeInTheDocument();
  });

  it("redirects Agent from team statistics to unauthorized", () => {
    renderRoutes("/team-statistics", "AGENT");

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users from team statistics to login", () => {
    renderRoutes("/team-statistics");

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();
  });

  // Unauthorized route test

  it("displays unauthorized page directly", () => {
    renderRoutes("/unauthorized");

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();
  });

  // Root route tests

  it("redirects authenticated users from root to dashboard", () => {
    renderRoutes("/", "ADMIN");

    expect(
      screen.getByText("Ticket dashboard page")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users from root to login", () => {
    renderRoutes("/");

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();
  });

  // Unknown route tests

  it("redirects authenticated users from unknown paths to dashboard", () => {
    renderRoutes("/unknown-page", "ADMIN");

    expect(
      screen.getByText("Ticket dashboard page")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users from unknown paths to login", () => {
    renderRoutes("/unknown-page");

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();
  });
});
