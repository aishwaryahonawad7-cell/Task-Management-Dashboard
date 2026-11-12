import { describe, it, expect } from "vitest";

import { loginUser } from "./authService";

describe("Authentication service", () => {
  it("should login an administrator", async () => {
    const response = await loginUser(
      "admin@example.com",
      "admin123"
    );

    expect(response.user.role).toBe("ADMIN");
    expect(response.user.email).toBe("admin@example.com");
  });

  it("should reject invalid credentials", async () => {
    await expect(
      loginUser("wrong@example.com", "wrong")
    ).rejects.toThrow("Invalid email or password");
  });
});