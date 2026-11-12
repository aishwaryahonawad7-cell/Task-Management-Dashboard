
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../pages/Login/Login";
import Unauthorized from "../pages/Unauthorized/Unauthorized";
import TicketDashboard from "../pages/TicketDashboard/TicketDashboard";

import ProtectedRoute from "./ProtectedRoute";
import RoleBasedRoute from "./RoleBasedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public route - Login */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Unauthorized page */}
      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>

        {/* Dashboard - All authenticated users */}
        <Route
          path="/dashboard"
          element={<TicketDashboard />}
        />

        {/* Admin only */}
        <Route
          element={<RoleBasedRoute allowedRoles={["ADMIN"]} />}
        >
          <Route
            path="/admin"
            element={<div>Administration Dashboard</div>}
          />
        </Route>

        {/* Admin and Manager */}
        <Route
          element={
            <RoleBasedRoute
              allowedRoles={["ADMIN", "MANAGER"]}
            />
          }
        >
          <Route
            path="/team-statistics"
            element={<div>Team Statistics</div>}
          />
        </Route>

      </Route>

      {/* Default route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
