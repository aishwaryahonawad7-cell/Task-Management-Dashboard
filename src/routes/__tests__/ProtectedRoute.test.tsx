
import {
  describe,
  expect,
  it,
  beforeEach,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { AuthProvider } from "../../context/AuthContext";
import AuthContext from "../../context/AuthContext";
import type { AuthContextType } from "../../types/auth.types";

import ProtectedRoute from "../ProtectedRoute";

const testUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

const LocationDisplay = () => {
  const location = useLocation();

  return (
    <p data-testid="location-state">
      {location.state?.from?.pathname ?? "No previous path"}
    </p>
  );
};

const renderProtectedRoute = (authenticated: boolean) => {
  if (authenticated) {
    sessionStorage.setItem(
      "support_auth",
      JSON.stringify(testUser)
    );
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/private"
              element={<p>Private content</p>}
            />
          </Route>

          <Route
            path="/login"
            element={
              <>
                <p>Login page</p>
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("allows authenticated users to access protected pages", () => {
    renderProtectedRoute(true);

    expect(
      screen.getByText("Private content")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Login page")
    ).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute(false);

    expect(
      screen.getByText("Login page")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Private content")
    ).not.toBeInTheDocument();
  });

  it("preserves the requested path during login redirect", () => {
    renderProtectedRoute(false);

    expect(
      screen.getByTestId("location-state")
    ).toHaveTextContent("/private");
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
        <MemoryRouter initialEntries={["/private"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route
                path="/private"
                element={<p>Private content</p>}
              />
            </Route>

            <Route
              path="/login"
              element={<p>Login page</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(
      screen.getByText("Checking authentication...")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Private content")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Login page")
    ).not.toBeInTheDocument();
  });

  it("shows loading instead of redirecting when authentication is still loading", () => {
    const loadingAuthValue: AuthContextType = {
      user: testUser,
      isAuthenticated: true,
      isLoading: true,
      login: async () => {},
      logout: () => {},
    };

    render(
      <AuthContext.Provider value={loadingAuthValue}>
        <MemoryRouter initialEntries={["/private"]}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route
                path="/private"
                element={<p>Private content</p>}
              />
            </Route>

            <Route
              path="/login"
              element={<p>Login page</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(
      screen.getByText("Checking authentication...")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Private content")
    ).not.toBeInTheDocument();
  });
});
