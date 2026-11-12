
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../test/mocks/server";
import { createTestStore } from "./testStore";

import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
} from "../ticketThunks";

import ticketService from "../../../services/ticketService";

import type { TicketFormData } from "../ticket.types";

import {
  mockTicket,
  mockTicketForm,
} from "./ticketFixtures";

describe("Ticket async thunks", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.restoreAllMocks();
    store = createTestStore();
  });

  // FETCH TICKETS

  it("should fetch tickets successfully", async () => {
    server.use(
      http.get("*/tickets", () => {
        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    const state = store.getState().tickets;

    expect(state.loading).toBe(false);
    expect(state.tickets).toEqual([mockTicket]);
    expect(state.total).toBe(1);
    expect(state.error).toBeNull();
  });

  it("should set loading while fetching tickets", async () => {
    const request = store.dispatch(
      fetchTickets({ page: 1, limit: 5 })
    );

    expect(store.getState().tickets.loading).toBe(true);

    await request;

    expect(store.getState().tickets.loading).toBe(false);
  });

  it("should handle server errors", async () => {
    server.use(
      http.get("*/tickets", () =>
        HttpResponse.json(
          { message: "Internal server error" },
          { status: 500 }
        )
      )
    );

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    expect(store.getState().tickets.loading).toBe(false);
    expect(store.getState().tickets.error).toBe(
      "Internal server error. Please try again later."
    );
  });

  // FETCH ERROR HANDLING

  const createAxiosError = (options: {
    status?: number;
    code?: string;
  } = {}) => {
    return Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      code: options.code,
      response:
        options.status !== undefined
          ? { status: options.status }
          : undefined,
    });
  };

  it.each([
    [400, "Invalid request. Please check your input."],
    [401, "Session expired. Please login again."],
    [403, "You are not authorized to perform this action."],
    [404, "Requested ticket was not found."],
    [500, "Internal server error. Please try again later."],
    [418, "Something went wrong. Please try again."],
  ])(
    "should handle HTTP %i errors",
    async (status, expectedMessage) => {
      vi.spyOn(ticketService, "getTickets").mockRejectedValue(
        createAxiosError({ status })
      );

      const result = await store.dispatch(
        fetchTickets({ page: 1, limit: 5 })
      );

      expect(fetchTickets.rejected.match(result)).toBe(true);
      expect(store.getState().tickets.error).toBe(expectedMessage);
      expect(store.getState().tickets.loading).toBe(false);
    }
  );

  it("should handle network errors", async () => {
    vi.spyOn(ticketService, "getTickets").mockRejectedValue(
      createAxiosError()
    );

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    expect(store.getState().tickets.error).toBe(
      "Network error. Please check your connection."
    );
  });

  it("should handle request timeout errors", async () => {
    vi.spyOn(ticketService, "getTickets").mockRejectedValue(
      createAxiosError({ code: "ECONNABORTED" })
    );

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    expect(store.getState().tickets.error).toBe(
      "Request timed out. Please try again."
    );
  });

  it("should handle cancelled request errors", async () => {
    vi.spyOn(ticketService, "getTickets").mockRejectedValue(
      createAxiosError({ code: "ERR_CANCELED" })
    );

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    expect(store.getState().tickets.error).toBe("Request cancelled");
  });

  it("should handle normal JavaScript errors", async () => {
    vi.spyOn(ticketService, "getTickets").mockRejectedValue(
      new Error("Unexpected application error")
    );

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    expect(store.getState().tickets.error).toBe(
      "Unexpected application error"
    );
  });

  it("should handle unexpected non-Error values", async () => {
    vi.spyOn(ticketService, "getTickets").mockRejectedValue("Unknown error");

    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));

    expect(store.getState().tickets.error).toBe(
      "An unexpected error occurred."
    );
  });

  // CREATE TICKET

  it("should create a ticket successfully", async () => {
    server.use(
      http.post("*/tickets", async ({ request }) => {
        const body = (await request.json()) as TicketFormData;

        return HttpResponse.json(
          {
            ...body,
            id: "TKT-002",
          },
          { status: 201 }
        );
      })
    );

    const result = await store.dispatch(createTicket(mockTicketForm));

    expect(result.meta.requestStatus).toBe("fulfilled");

    if (createTicket.fulfilled.match(result)) {
      expect(result.payload.customerName).toBe("Priya Sharma");
      expect(result.payload.subject).toBe("Payment issue");
      expect(result.payload.id).toBe("TKT-002");
    }
  });

  it("should handle ticket creation failure", async () => {
    vi.spyOn(ticketService, "createTicket").mockRejectedValue(
      new Error("Creation failed")
    );

    const result = await store.dispatch(createTicket(mockTicketForm));

    expect(createTicket.rejected.match(result)).toBe(true);

    if (createTicket.rejected.match(result)) {
      expect(result.payload).toBe("Creation failed");
    }
  });

  // UPDATE TICKET

  it("should update a ticket successfully", async () => {
    store.dispatch({
      type: fetchTickets.fulfilled.type,
      payload: {
        data: [mockTicket],
        total: 1,
      },
    });

    const updatedTicket = {
      ...mockTicket,
      status: "Resolved" as const,
    };

    server.use(
      http.patch("*/tickets/:id", () =>
        HttpResponse.json(updatedTicket)
      )
    );

    const result = await store.dispatch(
      updateTicket({
        id: "TKT-001",
        data: { status: "Resolved" },
      })
    );

    expect(result.meta.requestStatus).toBe("fulfilled");
    expect(store.getState().tickets.tickets[0].status).toBe("Resolved");
  });

  it("should handle ticket update failure", async () => {
    vi.spyOn(ticketService, "updateTicket").mockRejectedValue(
      new Error("Update failed")
    );

    const result = await store.dispatch(
      updateTicket({
        id: "TKT-001",
        data: { status: "Resolved" },
      })
    );

    expect(updateTicket.rejected.match(result)).toBe(true);

    if (updateTicket.rejected.match(result)) {
      expect(result.payload).toBe("Update failed");
    }
  });

  // DELETE TICKET

  it("should delete a ticket successfully", async () => {
    store.dispatch({
      type: fetchTickets.fulfilled.type,
      payload: {
        data: [mockTicket],
        total: 1,
      },
    });

    server.use(
      http.delete("*/tickets/:id", () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    const result = await store.dispatch(deleteTicket("TKT-001"));

    expect(result.meta.requestStatus).toBe("fulfilled");
    expect(store.getState().tickets.tickets).toHaveLength(0);
    expect(store.getState().tickets.total).toBe(0);
  });

  it("should handle ticket deletion failure", async () => {
    vi.spyOn(ticketService, "deleteTicket").mockRejectedValue(
      new Error("Deletion failed")
    );

    const result = await store.dispatch(deleteTicket("TKT-001"));

    expect(deleteTicket.rejected.match(result)).toBe(true);

    if (deleteTicket.rejected.match(result)) {
      expect(result.payload).toBe("Deletion failed");
    }
  });

  // ASSIGN TICKET

  it("should assign a ticket successfully", async () => {
    const assignedTicket = {
      ...mockTicket,
      assignedTo: "agent-1",
    };

    const assignSpy = vi
      .spyOn(ticketService, "assignTicket")
      .mockResolvedValue(assignedTicket);

    const result = await store.dispatch(
      assignTicket({
        ticketId: "TKT-001",
        agentId: "agent-1",
      })
    );

    expect(result.meta.requestStatus).toBe("fulfilled");
    expect(assignSpy).toHaveBeenCalledWith("TKT-001", "agent-1");

    if (assignTicket.fulfilled.match(result)) {
      expect(result.payload.assignedTo).toBe("agent-1");
    }
  });

  it("should allow unassigning a ticket", async () => {
    const unassignedTicket = {
      ...mockTicket,
      assignedTo: null,
    };

    vi.spyOn(ticketService, "assignTicket").mockResolvedValue(
      unassignedTicket
    );

    const result = await store.dispatch(
      assignTicket({
        ticketId: "TKT-001",
        agentId: null,
      })
    );

    expect(result.meta.requestStatus).toBe("fulfilled");

    if (assignTicket.fulfilled.match(result)) {
      expect(result.payload.assignedTo).toBeNull();
    }
  });

  it("should handle ticket assignment failure", async () => {
    vi.spyOn(ticketService, "assignTicket").mockRejectedValue(
      new Error("Assignment failed")
    );

    const result = await store.dispatch(
      assignTicket({
        ticketId: "TKT-001",
        agentId: "agent-1",
      })
    );

    expect(assignTicket.rejected.match(result)).toBe(true);

    if (assignTicket.rejected.match(result)) {
      expect(result.payload).toBe("Assignment failed");
    }
  });
});
