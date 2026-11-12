import type { TicketFormData } from "../features/tickets/ticket.types";

export type TicketFormErrors = Partial<
  Record<keyof TicketFormData, string>
>;

export const validateTicketForm = (
  data: TicketFormData
): TicketFormErrors => {
  const errors: TicketFormErrors = {};

  if (!data.customerName.trim()) {
    errors.customerName = "Customer name is required";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
  ) {
    errors.email = "Enter a valid email address";
  }

  if (!data.subject.trim()) {
    errors.subject = "Subject is required";
  }

  if (!data.description.trim()) {
    errors.description = "Description is required";
  }

  return errors;
};