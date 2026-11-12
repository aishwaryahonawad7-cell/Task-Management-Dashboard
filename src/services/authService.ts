
import type {
  User,
  MockUser,
  AuthResponse
} from "../types/auth.types";

// Mock users for different roles
const mockUsers: MockUser[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "ADMIN"
  },
  {
    id: "2",
    name: "Manager User",
    email: "manager@example.com",
    password: "manager123",
    role: "MANAGER"
  },
  {
    id: "3",
    name: "Agent User",
    email: "agent@example.com",
    password: "agent123",
    role: "AGENT"
  }
];

// Simulate API delay
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Login service
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {

  // Simulate API response time
  await delay(500);

  // Validate user credentials
  const user = mockUsers.find(
    (item) =>
      item.email === email &&
      item.password === password
  );

  // Handle invalid credentials
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Create user object without password
  const safeUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  // Return user details and mock token
  return {
    user: safeUser,
    token: `mock-token-${user.id}`
  };
};
