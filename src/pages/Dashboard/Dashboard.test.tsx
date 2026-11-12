
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import Dashboard from "./Dashboard";

import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

const mockLogout = vi.fn();
const mockLogin = vi.fn();
const mockCan = vi.fn();

const adminUser = {
  id: "admin-1",
  name: "Admin User",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

const managerUser = {
  id: "manager-1",
  name: "Manager User",
  email: "manager@example.com",
  role: "MANAGER" as const,
};

const agentUser = {
  id: "agent-1",
  name: "Agent User",
  email: "agent@example.com",
  role: "AGENT" as const,
};

const mockUseAuth = (
  user:
    | typeof adminUser
    | typeof managerUser
    | typeof agentUser
    | null
) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
  });
};

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // BASIC DASHBOARD TESTS
  // ==========================================

  it("does not render when the user is not logged in", () => {
    mockUseAuth(null);

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    const { container } = renderDashboard();

    expect(container.firstChild).toBeNull();
  });

  it("displays the logged-in user's information", () => {
    mockUseAuth(adminUser);

    mockCan.mockReturnValue(true);

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: "Welcome, Admin User",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Role: ADMIN")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dashboard Overview")
    ).toBeInTheDocument();
  });

  // ==========================================
  // ROLE-BASED DASHBOARD TESTS
  // ==========================================

  it("displays all permitted dashboard cards for an Admin", () => {
    mockUseAuth(adminUser);

    mockCan.mockReturnValue(true);

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("All Tickets")
    ).toBeInTheDocument();

    expect(
      screen.getByText("My Assigned Tickets")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Team Statistics")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Administration")
    ).toBeInTheDocument();
  });

  it("displays only permitted cards for an Agent", () => {
    mockUseAuth(agentUser);

    mockCan.mockImplementation(
      (permission: string) =>
        permission === "VIEW_ASSIGNED_TICKETS"
    );

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("My Assigned Tickets")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("All Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Team Statistics")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Administration")
    ).not.toBeInTheDocument();
  });

  it("displays permitted cards for a Manager", () => {
    mockUseAuth(managerUser);

    mockCan.mockImplementation(
      (permission: string) =>
        permission === "VIEW_ALL_TICKETS" ||
        permission === "VIEW_TEAM_STATS"
    );

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("All Tickets")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Team Statistics")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("My Assigned Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Administration")
    ).not.toBeInTheDocument();
  });

  it("hides all dashboard cards when the user has no permissions", () => {
    mockUseAuth(agentUser);

    mockCan.mockReturnValue(false);

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.queryByText("All Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("My Assigned Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Team Statistics")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Administration")
    ).not.toBeInTheDocument();
  });

  // ==========================================
  // LOGOUT TEST
  // ==========================================

  it("calls logout when the Logout button is clicked", () => {
    mockUseAuth(adminUser);

    mockCan.mockReturnValue(true);

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Logout",
      })
    );

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  // ==========================================
  // NAVIGATION TEST
  // ==========================================

  it("provides navigation links to permitted pages", () => {
    mockUseAuth(adminUser);

    mockCan.mockReturnValue(true);

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByRole("link", {
        name: "View Tickets",
      })
    ).toHaveAttribute(
      "href",
      "/dashboard/tickets"
    );

    expect(
      screen.getByRole("link", {
        name: "Open Administration",
      })
    ).toHaveAttribute(
      "href",
      "/admin"
    );

    expect(
      screen.getByRole("link", {
        name: "View Statistics",
      })
    ).toHaveAttribute(
      "href",
      "/team-statistics"
    );
  });

  // ==========================================
  // INDIVIDUAL PERMISSION TESTS
  // ==========================================

  it("renders only the All Tickets card when VIEW_ALL_TICKETS is granted", () => {
    mockUseAuth(adminUser);

    mockCan.mockImplementation(
      (permission: string) =>
        permission === "VIEW_ALL_TICKETS"
    );

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("All Tickets")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("My Assigned Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Team Statistics")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Administration")
    ).not.toBeInTheDocument();
  });

  it("renders only the My Assigned Tickets card when VIEW_ASSIGNED_TICKETS is granted", () => {
    mockUseAuth(agentUser);

    mockCan.mockImplementation(
      (permission: string) =>
        permission === "VIEW_ASSIGNED_TICKETS"
    );

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("My Assigned Tickets")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("All Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Team Statistics")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Administration")
    ).not.toBeInTheDocument();
  });

  it("renders only the Team Statistics card when VIEW_TEAM_STATS is granted", () => {
    mockUseAuth(managerUser);

    mockCan.mockImplementation(
      (permission: string) =>
        permission === "VIEW_TEAM_STATS"
    );

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("Team Statistics")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("All Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("My Assigned Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Administration")
    ).not.toBeInTheDocument();
  });

  it("renders only the Administration card when ACCESS_ADMIN is granted", () => {
    mockUseAuth(adminUser);

    mockCan.mockImplementation(
      (permission: string) =>
        permission === "ACCESS_ADMIN"
    );

    vi.mocked(usePermissions).mockReturnValue({
      can: mockCan,
    });

    renderDashboard();

    expect(
      screen.getByText("Administration")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("All Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("My Assigned Tickets")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Team Statistics")
    ).not.toBeInTheDocument();
  });
});
