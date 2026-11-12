export type TicketStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type TicketPriority =
  | "Low"
  | "Medium"
  | "High";

export interface Ticket {
  id: string;
  customerName: string;
  email: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  assignedTo: string | null;
}

export type TicketFormData = Omit<
  Ticket,
  "id" | "createdAt" | "assignedTo"
> & {
  assignedTo?: string | null;
};

export interface TicketQueryParams {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;

  sortBy?: "createdAt" | "priority";
  order?: "asc" | "desc";

  page?: number;
  limit?: number;
}

export interface TicketListResponse {
  data: Ticket[];
  total: number;
}