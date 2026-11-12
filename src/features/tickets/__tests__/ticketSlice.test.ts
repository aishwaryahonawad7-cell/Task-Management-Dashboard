
import { describe, expect, it } from "vitest";

import ticketReducer, {
  clearTicketError,
  clearTickets,
} from "../ticketSlice";

import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
} from "../ticketThunks";

import type { TicketState } from "../ticket.types";

import { mockTicket } from "./ticketFixtures";

describe("Ticket Redux Slice", () => {
  const initialState: TicketState = {
    tickets: [],
    total: 0,
    loading: false,
    error: null,
  };

  const populatedState: TicketState = {
    tickets: [mockTicket],
    total: 1,
    loading: false,
    error: "Previous error",
  };

  it("should return the initial state", () => {
    const state = ticketReducer(undefined, {
      type: "unknown",
    });

    expect(state).toEqual(initialState);
  });

  // CLEAR ACTIONS

  it("should clear the ticket error", () => {
    const state = ticketReducer(
      populatedState,
      clearTicketError()
    );

    expect(state.error).toBeNull();
    expect(state.tickets).toEqual([mockTicket]);
  });

  it("should clear all tickets and reset the state", () => {
    const state = ticketReducer(
      {
        ...populatedState,
        loading: true,
        currentRequestId: "request-1",
      },
      clearTickets()
    );

    expect(state.tickets).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.currentRequestId).toBeUndefined();
  });

  // FETCH TICKETS

  it("should set loading to true when fetching tickets", () => {
    const state = ticketReducer(
      initialState,
      fetchTickets.pending("request-1", {})
    );

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.currentRequestId).toBe("request-1");
  });

  it("should store tickets after successful fetching", () => {
    const state = ticketReducer(
      {
        ...initialState,
        loading: true,
        currentRequestId: "request-1",
      },
      fetchTickets.fulfilled(
        { data: [mockTicket], total: 1 },
        "request-1",
        {}
      )
    );

    expect(state.loading).toBe(false);
    expect(state.tickets).toEqual([mockTicket]);
    expect(state.total).toBe(1);
    expect(state.error).toBeNull();
  });

  it("should ignore a stale fetch success response", () => {
    const state = ticketReducer(
      {
        ...initialState,
        loading: true,
        currentRequestId: "request-2",
      },
      fetchTickets.fulfilled(
        { data: [mockTicket], total: 1 },
        "request-1",
        {}
      )
    );

    expect(state.loading).toBe(true);
    expect(state.tickets).toEqual([]);
    expect(state.currentRequestId).toBe("request-2");
  });

  it("should store error when fetching tickets fails", () => {
    const state = ticketReducer(
      {
        ...initialState,
        loading: true,
        currentRequestId: "request-1",
      },
      fetchTickets.rejected(
        new Error("Rejected"),
        "request-1",
        {},
        "Server error"
      )
    );

    expect(state.loading).toBe(false);
    expect(state.error).toBe("Server error");
  });

  it("should use the default error when fetch rejection has no payload", () => {
    const state = ticketReducer(
      {
        ...initialState,
        currentRequestId: "request-1",
      },
      fetchTickets.rejected(
        new Error("Rejected"),
        "request-1",
        {}
      )
    );

    expect(state.error).toBe("Failed to fetch tickets.");
    expect(state.loading).toBe(false);
  });

  it("should ignore a stale fetch failure response", () => {
    const state = ticketReducer(
      {
        ...initialState,
        loading: true,
        currentRequestId: "request-2",
      },
      fetchTickets.rejected(
        new Error("Rejected"),
        "request-1",
        {},
        "Old error"
      )
    );

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.currentRequestId).toBe("request-2");
  });

  it("should not store an error when fetch is aborted", () => {
    const state = ticketReducer(
      {
        ...initialState,
        loading: true,
        currentRequestId: "request-1",
      },
      {
        type: fetchTickets.rejected.type,
        payload: undefined,
        error: { message: "Aborted" },
        meta: {
          requestId: "request-1",
          requestStatus: "rejected",
          arg: {},
          aborted: true,
          condition: false,
        },
      }
    );

    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  // CREATE TICKET

  it("should clear the error when create request starts", () => {
    const state = ticketReducer(
      populatedState,
      {
        type: createTicket.pending.type,
      }
    );

    expect(state.error).toBeNull();
  });

  it("should not insert a created ticket into a potentially filtered or paginated list", () => {
    const state = ticketReducer(
      initialState,
      {
        type: createTicket.fulfilled.type,
        payload: mockTicket,
      }
    );

    expect(state.tickets).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.error).toBeNull();
  });

  it("should store create error from rejected action", () => {
    const state = ticketReducer(
      initialState,
      {
        type: createTicket.rejected.type,
        payload: "Create failed",
      }
    );

    expect(state.error).toBe("Create failed");
  });

  it("should use default create error when payload is missing", () => {
    const state = ticketReducer(
      initialState,
      {
        type: createTicket.rejected.type,
        payload: undefined,
      }
    );

    expect(state.error).toBe("Failed to create ticket.");
  });

  // UPDATE TICKET

  it("should clear error when update request starts", () => {
    const state = ticketReducer(
      populatedState,
      {
        type: updateTicket.pending.type,
      }
    );

    expect(state.error).toBeNull();
  });

  it("should update an existing ticket", () => {
    const updatedTicket = {
      ...mockTicket,
      status: "Resolved" as const,
    };

    const state = ticketReducer(
      populatedState,
      {
        type: updateTicket.fulfilled.type,
        payload: updatedTicket,
      }
    );

    expect(state.tickets[0]).toEqual(updatedTicket);
    expect(state.error).toBeNull();
  });

  it("should not add a ticket when updating a non-existing ticket", () => {
    const updatedTicket = {
      ...mockTicket,
      id: "TKT-999",
    };

    const state = ticketReducer(
      populatedState,
      {
        type: updateTicket.fulfilled.type,
        payload: updatedTicket,
      }
    );

    expect(state.tickets).toEqual([mockTicket]);
    expect(state.tickets).toHaveLength(1);
  });

  it("should store update error from rejected action", () => {
    const state = ticketReducer(
      initialState,
      {
        type: updateTicket.rejected.type,
        payload: "Update failed",
      }
    );

    expect(state.error).toBe("Update failed");
  });

  it("should use default update error when payload is missing", () => {
    const state = ticketReducer(
      initialState,
      {
        type: updateTicket.rejected.type,
        payload: undefined,
      }
    );

    expect(state.error).toBe("Failed to update ticket.");
  });

  // DELETE TICKET

  it("should clear error when delete request starts", () => {
    const state = ticketReducer(
      populatedState,
      {
        type: deleteTicket.pending.type,
      }
    );

    expect(state.error).toBeNull();
  });

  it("should remove a deleted ticket and update total", () => {
    const state = ticketReducer(
      populatedState,
      {
        type: deleteTicket.fulfilled.type,
        payload: mockTicket.id,
      }
    );

    expect(state.tickets).toHaveLength(0);
    expect(state.total).toBe(0);
    expect(state.error).toBeNull();
  });

  it("should not allow total to become negative", () => {
    const state = ticketReducer(
      {
        ...initialState,
        total: 0,
      },
      {
        type: deleteTicket.fulfilled.type,
        payload: "TKT-999",
      }
    );

    expect(state.total).toBe(0);
  });

  it("should store delete error from rejected action", () => {
    const state = ticketReducer(
      initialState,
      {
        type: deleteTicket.rejected.type,
        payload: "Delete failed",
      }
    );

    expect(state.error).toBe("Delete failed");
  });

  it("should use default delete error when payload is missing", () => {
    const state = ticketReducer(
      initialState,
      {
        type: deleteTicket.rejected.type,
        payload: undefined,
      }
    );

    expect(state.error).toBe("Failed to delete ticket.");
  });

  // ASSIGN TICKET

  it("should clear error when assign request starts", () => {
    const state = ticketReducer(
      populatedState,
      {
        type: assignTicket.pending.type,
      }
    );

    expect(state.error).toBeNull();
  });

  it("should update an existing ticket after assignment", () => {
    const assignedTicket = {
      ...mockTicket,
      assignedTo: "agent-1",
    };

    const state = ticketReducer(
      populatedState,
      {
        type: assignTicket.fulfilled.type,
        payload: assignedTicket,
      }
    );

    expect(state.tickets[0]).toEqual(assignedTicket);
    expect(state.error).toBeNull();
  });

  it("should not add a ticket when assigning a non-existing ticket", () => {
    const assignedTicket = {
      ...mockTicket,
      id: "TKT-999",
      assignedTo: "agent-1",
    };

    const state = ticketReducer(
      populatedState,
      {
        type: assignTicket.fulfilled.type,
        payload: assignedTicket,
      }
    );

    expect(state.tickets).toEqual([mockTicket]);
    expect(state.tickets).toHaveLength(1);
  });

  it("should store assign error from rejected action", () => {
    const state = ticketReducer(
      initialState,
      {
        type: assignTicket.rejected.type,
        payload: "Assignment failed",
      }
    );

    expect(state.error).toBe("Assignment failed");
  });

  it("should use default assign error when payload is missing", () => {
    const state = ticketReducer(
      initialState,
      {
        type: assignTicket.rejected.type,
        payload: undefined,
      }
    );

    expect(state.error).toBe("Failed to assign ticket.");
  });
});
