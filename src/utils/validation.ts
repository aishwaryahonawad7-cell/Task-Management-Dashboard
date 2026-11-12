import type { TicketFormData } from "../types/ticket.types";

export interface ValidationErrors {
  customerName?: string;
  email?: string;
  subject?: string;
  description?: string;
}

export function validateTicketForm(
  data: TicketFormData
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Customer name validation
  if (!data.customerName.trim()) {
    errors.customerName = "Customer name is required";
  }

  // Email validation
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    errors.email = "Please enter a valid email address";
  }

  // Subject validation
  if (!data.subject.trim()) {
    errors.subject = "Subject is required";
  }

  // Description validation
  if (!data.description.trim()) {
    errors.description = "Description is required";
  }

  return errors;
}