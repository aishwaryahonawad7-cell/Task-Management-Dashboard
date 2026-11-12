import {
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p>Checking authentication...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;