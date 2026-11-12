import { describe, it, expect } from "vitest";

import { hasPermission } from "./permissions";

describe("RBAC permissions", () => {
  it("should allow admin to delete tickets", () => {
    expect(
      hasPermission("ADMIN", "DELETE_TICKET")
    ).toBe(true);
  });

  it("should prevent manager from deleting tickets", () => {
    expect(
      hasPermission("MANAGER", "DELETE_TICKET")
    ).toBe(false);
  });

  it("should prevent agent from viewing all tickets", () => {
    expect(
      hasPermission("AGENT", "VIEW_ALL_TICKETS")
    ).toBe(false);
  });

  it("should allow agent to manage status", () => {
    expect(
      hasPermission("AGENT", "MANAGE_STATUS")
    ).toBe(true);
  });
});