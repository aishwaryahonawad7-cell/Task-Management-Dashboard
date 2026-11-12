
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AuthProvider } from "../../context/AuthContext";
import TicketTable from "./TicketTable";

import type { Ticket } from "../../types/ticket.types";

const mockTickets: Ticket[] = [
  {
    id: "TKT-1001",
    customerName: "Rahul Sharma",
    email: "rahul@gmail.com",
    subject: "Payment issue",
    description: "Payment failed",
    priority: "High",
    status: "Open",
    createdAt: "2026-11-01T10:00:00.000Z",
    assignedTo: "3"
  }
];

// Reusable render function
const renderTicketTable = (tickets: Ticket[]) => {
  return render(
    <AuthProvider>
      <TicketTable
        tickets={tickets}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    </AuthProvider>
  );
};

describe("TicketTable", () => {
  it("renders ticket details correctly", () => {
    renderTicketTable(mockTickets);

    expect(
      screen.getByText("Rahul Sharma")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Payment issue")
    ).toBeInTheDocument();

    expect(
      screen.getByText("TKT-1001")
    ).toBeInTheDocument();
  });

  it("displays empty state when no tickets exist", () => {
    renderTicketTable([]);

    expect(
      screen.getByText("No tickets found.")
    ).toBeInTheDocument();
  });
});
