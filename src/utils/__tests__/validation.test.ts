
import { describe, expect, it } from "vitest";

import { validateTicketForm } from "../validation";
import type { TicketFormData } from "../../types/ticket.types";

const validTicket: TicketFormData = {
  customerName: "Rahul Sharma",
  email: "rahul@example.com",
  subject: "Login issue",
  description: "Unable to login to the application",
  priority: "High",
  status: "Open",
};

describe("validateTicketForm", () => {
  it("returns no errors for valid ticket data", () => {
    expect(validateTicketForm(validTicket)).toEqual({});
  });

  it("validates an empty customer name", () => {
    const result = validateTicketForm({
      ...validTicket,
      customerName: "",
    });

    expect(result.customerName).toBe("Customer name is required");
  });

  it("validates a whitespace-only customer name", () => {
    const result = validateTicketForm({
      ...validTicket,
      customerName: "   ",
    });

    expect(result.customerName).toBe("Customer name is required");
  });

  it("validates an empty email", () => {
    const result = validateTicketForm({
      ...validTicket,
      email: "",
    });

    expect(result.email).toBe("Email is required");
  });

  it("validates a whitespace-only email", () => {
    const result = validateTicketForm({
      ...validTicket,
      email: "   ",
    });

    expect(result.email).toBe("Email is required");
  });

  it.each([
    "invalid-email",
    "rahul@",
    "@example.com",
    "rahul@example",
    "rahul example@example.com",
  ])("rejects invalid email: %s", (email) => {
    const result = validateTicketForm({
      ...validTicket,
      email,
    });

    expect(result.email).toBe(
      "Please enter a valid email address"
    );
  });

  it("validates an empty subject", () => {
    const result = validateTicketForm({
      ...validTicket,
      subject: "",
    });

    expect(result.subject).toBe("Subject is required");
  });

  it("validates a whitespace-only subject", () => {
    const result = validateTicketForm({
      ...validTicket,
      subject: "   ",
    });

    expect(result.subject).toBe("Subject is required");
  });

  it("validates an empty description", () => {
    const result = validateTicketForm({
      ...validTicket,
      description: "",
    });

    expect(result.description).toBe("Description is required");
  });

  it("validates a whitespace-only description", () => {
    const result = validateTicketForm({
      ...validTicket,
      description: "   ",
    });

    expect(result.description).toBe("Description is required");
  });

  it("returns all validation errors when all required fields are empty", () => {
    const result = validateTicketForm({
      ...validTicket,
      customerName: "",
      email: "",
      subject: "",
      description: "",
    });

    expect(result).toEqual({
      customerName: "Customer name is required",
      email: "Email is required",
      subject: "Subject is required",
      description: "Description is required",
    });
  });

  it("accepts a valid email address with a subdomain", () => {
    const result = validateTicketForm({
      ...validTicket,
      email: "rahul@mail.example.com",
    });

    expect(result.email).toBeUndefined();
  });
});
