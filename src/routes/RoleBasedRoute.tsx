import {
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import type {
  UserRole
} from "../types/auth.types";

interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
}

const RoleBasedRoute = ({
  allowedRoles
}: RoleBasedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleBasedRoute;