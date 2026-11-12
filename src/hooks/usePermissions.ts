import { useCallback } from "react";

import { useAuth } from "./useAuth";

import type {
  Permission
} from "../types/auth.types";

import { hasPermission } from "../utils/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;

      return hasPermission(user.role, permission);
    },
    [user]
  );

  return { can };
};