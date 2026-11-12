import type {
  Permission,
  UserRole
} from "../types/auth.types";

export const rolePermissions: Record<
  UserRole,
  Permission[]
> = {
  ADMIN: [
    "VIEW_ALL_TICKETS",
    "CREATE_TICKET",
    "UPDATE_TICKET",
    "DELETE_TICKET",
    "ASSIGN_TICKET",
    "MANAGE_STATUS",
    "MANAGE_PRIORITY",
    "VIEW_TEAM_STATS",
    "ACCESS_ADMIN"
  ],

  MANAGER: [
    "VIEW_ALL_TICKETS",
    "ASSIGN_TICKET",
    "UPDATE_TICKET",
    "MANAGE_STATUS",
    "MANAGE_PRIORITY",
    "VIEW_TEAM_STATS"
  ],

  AGENT: [
    "VIEW_ASSIGNED_TICKETS",
    "MANAGE_STATUS"
  ]
};
export const hasPermission = (
  role: UserRole,
  permission: Permission
): boolean => {
  return rolePermissions[role].includes(permission);
};