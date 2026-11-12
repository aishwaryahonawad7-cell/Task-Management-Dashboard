
import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext";
import RoleBasedRoute from "../RoleBasedRoute";

function renderRoute(
  role: "ADMIN" | "MANAGER" | "AGENT" | null,
  allowedRoles: ("ADMIN" | "MANAGER" | "AGENT")[]
) {
  sessionStorage.clear();

  if (role) {
    sessionStorage.setItem(
      "support_auth",
      JSON.stringify({
        id: "u1",
        name: "Test",
        email: "test@example.com",
        role,
      })
    );
  }

  return render(
    <MemoryRouter initialEntries={["/restricted"]}>
      <AuthProvider>
        <Routes>
          <Route
            element={
              <RoleBasedRoute allowedRoles={allowedRoles} />
            }
          >
            <Route
              path="/restricted"
              element={<p>Protected content</p>}
            />
          </Route>

          <Route
            path="/unauthorized"
            element={<p>Unauthorized page</p>}
          />

          <Route
            path="/login"
            element={<p>Login page</p>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RoleBasedRoute", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders protected content for an allowed Admin role", () => {
    renderRoute("ADMIN", ["ADMIN"]);

    expect(
      screen.getByText("Protected content")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Unauthorized page")
    ).not.toBeInTheDocument();
  });

  it("allows Manager when Manager role is permitted", () => {
    renderRoute("MANAGER", ["ADMIN", "MANAGER"]);

    expect(
      screen.getByText("Protected content")
    ).toBeInTheDocument();
  });

  it("allows Agent when Agent role is permitted", () => {
    renderRoute("AGENT", ["AGENT"]);

    expect(
      screen.getByText("Protected content")
    ).toBeInTheDocument();
  });

  it("redirects a disallowed Agent role to unauthorized", () => {
    renderRoute("AGENT", ["ADMIN"]);

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Protected content")
    ).not.toBeInTheDocument();
  });

  it("redirects a disallowed Manager role to unauthorized", () => {
    renderRoute("MANAGER", ["ADMIN"]);

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderRoute(null, ["ADMIN"]);

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Protected content")
    ).not.toBeInTheDocument();
  });

  it("redirects users to unauthorized when no roles are allowed", () => {
    renderRoute("ADMIN", []);

    expect(
      screen.getByText("Unauthorized page")
    ).toBeInTheDocument();
  });

  it("allows any authenticated role when all roles are permitted", () => {
    renderRoute("ADMIN", ["ADMIN", "MANAGER", "AGENT"]);

    expect(
      screen.getByText("Protected content")
    ).toBeInTheDocument();
  });
});
