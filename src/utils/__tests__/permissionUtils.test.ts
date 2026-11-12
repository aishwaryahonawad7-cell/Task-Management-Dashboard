import { describe, expect, it } from "vitest";

import { hasPermission } from "../permissionUtils";

const adminPermissions = [
  "VIEW_ALL_TICKETS",
  "CREATE_TICKET",
  "UPDATE_TICKET",
  "DELETE_TICKET",
] as const;

const managerPermissions = [
  "VIEW_TEAM_TICKETS",
  "ASSIGN_TICKET",
  "MANAGE_STATUS",
] as const;

const agentPermissions = [
  "VIEW_ASSIGNED_TICKETS",
  "UPDATE_TICKET",
] as const;

describe("hasPermission utility", () => {
  it("should allow admin to delete tickets", () => {
    expect(
      hasPermission(adminPermissions, "DELETE_TICKET")
    ).toBe(true);
  });

  it("should allow manager to assign tickets", () => {
    expect(
      hasPermission(managerPermissions, "ASSIGN_TICKET")
    ).toBe(true);
  });

  it("should allow agent to update tickets", () => {
    expect(
      hasPermission(agentPermissions, "UPDATE_TICKET")
    ).toBe(true);
  });

  it("should deny agent from deleting tickets", () => {
    expect(
      hasPermission(agentPermissions, "DELETE_TICKET")
    ).toBe(false);
  });

  it("should deny manager from deleting tickets", () => {
    expect(
      hasPermission(managerPermissions, "DELETE_TICKET")
    ).toBe(false);
  });

  it("should deny permissions that do not exist", () => {
    expect(
      hasPermission(agentPermissions, "MANAGE_USERS")
    ).toBe(false);
  });

  it("should return false for an empty permission list", () => {
    expect(
      hasPermission([], "DELETE_TICKET")
    ).toBe(false);
  });
});