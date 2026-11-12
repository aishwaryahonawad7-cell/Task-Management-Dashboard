
// Available user roles
export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "AGENT";

// Available permissions
export type Permission =
  | "VIEW_ALL_TICKETS"
  | "VIEW_ASSIGNED_TICKETS"
  | "CREATE_TICKET"
  | "UPDATE_TICKET"
  | "DELETE_TICKET"
  | "ASSIGN_TICKET"
  | "MANAGE_STATUS"
  | "MANAGE_PRIORITY"
  | "VIEW_TEAM_STATS"
  | "ACCESS_ADMIN";

// User details
// Password is not included here.
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Mock user includes password for login validation
export interface MockUser extends User {
  password: string;
}

// Login response
export interface AuthResponse {
  user: User;
  token: string;
}

// Authentication context
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}
