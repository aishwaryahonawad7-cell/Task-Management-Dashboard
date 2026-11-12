
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
import AuthContext from "../../context/AuthContext";
import type { AuthContextType } from "../../types/auth.types";

import PublicOnlyRoute from "../PublicOnlyRoute";

const testUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

const renderPublicRoute = (authenticated: boolean) => {
  if (authenticated) {
    sessionStorage.setItem(
      "support_auth",
      JSON.stringify(testUser)
    );
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route
              path="/login"
              element={<p>Login page</p>}
            />
          </Route>

          <Route
            path="/dashboard"
            element={<p>Dashboard page</p>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("PublicOnlyRoute", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("allows unauthenticated users to access login", () => {
    renderPublicRoute(false);

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Dashboard page")
    ).not.toBeInTheDocument();
  });

  it("redirects authenticated users to dashboard", () => {
    renderPublicRoute(true);

    expect(
      screen.getByText("Dashboard page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Login page")
    ).not.toBeInTheDocument();
  });

  it("shows loading message while authentication is being checked", () => {
    const loadingAuthValue: AuthContextType = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async () => {},
      logout: () => {},
    };

    render(
      <AuthContext.Provider value={loadingAuthValue}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route
                path="/login"
                element={<p>Login page</p>}
              />
            </Route>

            <Route
              path="/dashboard"
              element={<p>Dashboard page</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(
      screen.getByText("Checking authentication...")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Login page")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Dashboard page")
    ).not.toBeInTheDocument();
  });

  it("shows loading instead of redirecting when an authenticated user's session is still loading", () => {
    const loadingAuthValue: AuthContextType = {
      user: testUser,
      isAuthenticated: true,
      isLoading: true,
      login: async () => {},
      logout: () => {},
    };

    render(
      <AuthContext.Provider value={loadingAuthValue}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route
                path="/login"
                element={<p>Login page</p>}
              />
            </Route>

            <Route
              path="/dashboard"
              element={<p>Dashboard page</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(
      screen.getByText("Checking authentication...")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Dashboard page")
    ).not.toBeInTheDocument();
  });
});
