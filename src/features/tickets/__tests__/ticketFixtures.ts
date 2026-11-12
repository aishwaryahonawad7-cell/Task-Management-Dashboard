import type {
  Ticket,
  TicketFormData,
} from "../ticket.types";

export const mockTicket: Ticket = {
  id: "TKT-001",
  customerName: "Rahul Sharma",
  email: "rahul@example.com",
  subject: "Login issue",
  description: "Unable to login to the application",
  priority: "High",
  status: "Open",
  createdAt: "2026-11-06T09:00:00.000Z",
  assignedTo: "agent-1",
};

export const mockTicketForm: TicketFormData = {
  customerName: "Priya Sharma",
  email: "priya@example.com",
  subject: "Payment issue",
  description: "Payment is not processing",
  priority: "Medium",
  status: "Open",
};