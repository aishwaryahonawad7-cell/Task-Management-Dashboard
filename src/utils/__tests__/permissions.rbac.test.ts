import { describe, expect, it } from "vitest";
import { hasPermission } from "../permissions";

describe("RBAC permission matrix", () => {
  it("allows Admin to create, update, delete, assign and view all tickets", () => {
    expect(hasPermission("ADMIN", "CREATE_TICKET")).toBe(true);
    expect(hasPermission("ADMIN", "UPDATE_TICKET")).toBe(true);
    expect(hasPermission("ADMIN", "DELETE_TICKET")).toBe(true);
    expect(hasPermission("ADMIN", "ASSIGN_TICKET")).toBe(true);
    expect(hasPermission("ADMIN", "VIEW_ALL_TICKETS")).toBe(true);
  });

  it("allows Manager to view all, assign and update but not delete/create", () => {
    expect(hasPermission("MANAGER", "VIEW_ALL_TICKETS")).toBe(true);
    expect(hasPermission("MANAGER", "ASSIGN_TICKET")).toBe(true);
    expect(hasPermission("MANAGER", "UPDATE_TICKET")).toBe(true);
    expect(hasPermission("MANAGER", "DELETE_TICKET")).toBe(false);
    expect(hasPermission("MANAGER", "CREATE_TICKET")).toBe(false);
  });

  it("limits Agent to assigned tickets and status management", () => {
    expect(hasPermission("AGENT", "VIEW_ASSIGNED_TICKETS")).toBe(true);
    expect(hasPermission("AGENT", "MANAGE_STATUS")).toBe(true);
    expect(hasPermission("AGENT", "VIEW_ALL_TICKETS")).toBe(false);
    expect(hasPermission("AGENT", "UPDATE_TICKET")).toBe(false);
    expect(hasPermission("AGENT", "DELETE_TICKET")).toBe(false);
  });
});
