import { describe, expect, it } from "vitest";

import { validateTicketForm } from "../validateTicket";

import type { TicketFormData } from "../../features/tickets/ticket.types";

const validTicket: TicketFormData = {
  customerName: "Rahul Sharma",
  email: "rahul@example.com",
  subject: "Login issue",
  description: "Unable to login to the application",
  priority: "High",
  status: "Open",
};

describe("validateTicketForm utility", () => {
  it("should return no errors for valid ticket data", () => {
    const result = validateTicketForm(validTicket);

    expect(result).toEqual({});
  });

  it("should validate required customer name", () => {
    const result = validateTicketForm({
      ...validTicket,
      customerName: "",
    });

    expect(result.customerName).toBe(
      "Customer name is required"
    );
  });

  it("should validate required email", () => {
    const result = validateTicketForm({
      ...validTicket,
      email: "",
    });

    expect(result.email).toBe("Email is required");
  });

  it("should reject invalid email", () => {
    const result = validateTicketForm({
      ...validTicket,
      email: "invalid-email",
    });

    expect(result.email).toBe(
      "Enter a valid email address"
    );
  });

  it("should validate subject and description", () => {
    const result = validateTicketForm({
      ...validTicket,
      subject: "",
      description: "",
    });

    expect(result.subject).toBe("Subject is required");
    expect(result.description).toBe("Description is required");
  });

  it("should reject whitespace-only values", () => {
    const result = validateTicketForm({
      ...validTicket,
      customerName: "   ",
    });

    expect(result.customerName).toBe(
      "Customer name is required"
    );
  });
});