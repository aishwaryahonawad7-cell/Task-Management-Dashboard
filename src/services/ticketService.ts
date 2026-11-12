
import apiClient from "./apiClient";

import type {
  Ticket,
  TicketFormData,
  TicketQueryParams,
  TicketListResponse,
} from "../features/tickets/ticket.types";

const ticketService = {
  // ==========================================
  // GET: Fetch tickets
  // ==========================================

  async getTickets(
    params: TicketQueryParams,
    signal?: AbortSignal
  ): Promise<TicketListResponse> {
    const response = await apiClient.get<Ticket[]>("/tickets", {
      params: {
        _page: params.page ?? 1,
        _limit: params.limit ?? 5,

        q: params.search || undefined,
        status: params.status || undefined,
        priority: params.priority || undefined,
        assignedTo: params.assignedTo || undefined,

        _sort: params.sortBy || undefined,
        _order: params.order || undefined,
      },
      signal,
    });

    return {
      data: response.data,
      total: Number(
        response.headers["x-total-count"] ??
          response.data.length
      ),
    };
  },

  // ==========================================
  // POST: Create ticket
  // ==========================================

  async createTicket(data: TicketFormData): Promise<Ticket> {
    const payload: Ticket = {
      id: `TKT-${Date.now()}`,
      customerName: data.customerName.trim(),
      email: data.email.trim(),
      subject: data.subject.trim(),
      description: data.description.trim(),
      priority: data.priority,
      status: data.status,
      assignedTo: data.assignedTo ?? null,
      createdAt: new Date().toISOString(),
    };

    const response = await apiClient.post<Ticket>(
      "/tickets",
      payload
    );

    return response.data;
  },

  // ==========================================
  // PATCH: Update ticket
  // ==========================================

  async updateTicket(
    id: string,
    data: Partial<TicketFormData>
  ): Promise<Ticket> {
    const response = await apiClient.patch<Ticket>(
      `/tickets/${id}`,
      data
    );

    return response.data;
  },

  // ==========================================
  // PATCH: Assign ticket
  // ==========================================

  async assignTicket(
    ticketId: string,
    agentId: string | null
  ): Promise<Ticket> {
    const response = await apiClient.patch<Ticket>(
      `/tickets/${ticketId}`,
      {
        assignedTo: agentId,
      }
    );

    return response.data;
  },

  // ==========================================
  // DELETE: Delete ticket
  // ==========================================

  async deleteTicket(id: string): Promise<string> {
    await apiClient.delete(`/tickets/${id}`);

    return id;
  },
};

export default ticketService;
