import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../../../context/AuthContext";
import TicketTable from "../TicketTable";
import type { Ticket } from "../../../features/tickets/ticket.types";

const ticket: Ticket = {
  id: "TKT-900", customerName: "Casey Customer", email: "casey@example.com",
  subject: "Cannot sign in", description: "Login error", priority: "High", status: "Open",
  createdAt: "2026-11-01T10:00:00.000Z", assignedTo: "agent-1",
};
const admin = { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" };
const manager = { id: "manager-1", name: "Manager", email: "manager@example.com", role: "MANAGER" };
const agent = { id: "agent-1", name: "Agent", email: "agent@example.com", role: "AGENT" };

function renderForRole(user: typeof admin | typeof manager | typeof agent, assignedTo = ticket.assignedTo) {
  sessionStorage.setItem("support_auth", JSON.stringify(user));
  return render(<AuthProvider><TicketTable tickets={[{ ...ticket, assignedTo }]} onEdit={vi.fn()} onDelete={vi.fn()} onUpdateStatus={vi.fn()} /></AuthProvider>);
}

describe("TicketTable role-based actions", () => {
  beforeEach(() => sessionStorage.clear());

  it("shows edit and delete actions for Admin", () => {
    renderForRole(admin);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows edit but not delete for Manager", () => {
    renderForRole(manager);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows status action but not edit/delete for assigned Agent", () => {
    renderForRole(agent);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update status/i })).toBeInTheDocument();
  });

  it("does not show Agent actions for an unassigned ticket", () => {
    renderForRole(agent, "another-agent");
    expect(screen.queryByRole("button", { name: /update status/i })).not.toBeInTheDocument();
  });
});
