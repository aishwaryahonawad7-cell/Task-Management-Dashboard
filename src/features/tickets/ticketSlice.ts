
import { createSlice } from "@reduxjs/toolkit";

import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
} from "./ticketThunks";

import type { TicketState } from "./ticket.types";

const initialState: TicketState = {
  tickets: [],
  total: 0,
  loading: false,
  error: null,
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,

  reducers: {
    // Clear API error
    clearTicketError(state) {
      state.error = null;
    },

    // Clear all ticket data
    clearTickets(state) {
      state.tickets = [];
      state.total = 0;
      state.error = null;
      state.loading = false;
      state.currentRequestId = undefined;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==========================================
      // 1. FETCH TICKETS
      // ==========================================

      .addCase(fetchTickets.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchTickets.fulfilled, (state, action) => {
        if (state.currentRequestId && state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.tickets = action.payload.data;
        state.total = action.payload.total;
        state.error = null;
      })

      .addCase(fetchTickets.rejected, (state, action) => {
        if (state.currentRequestId && state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;

        if (!action.meta.aborted) {
          state.error =
            action.payload ?? "Failed to fetch tickets.";
        }
      })

      // ==========================================
      // 2. CREATE TICKET
      // ==========================================

      .addCase(createTicket.pending, (state) => {
        state.error = null;
      })

      .addCase(createTicket.fulfilled, (state) => {
        state.error = null;

        // Dashboard refetches the list after creation.
        // Avoid inserting a ticket into a potentially
        // filtered or paginated result here.
      })

      .addCase(createTicket.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to create ticket.";
      })

      // ==========================================
      // 3. UPDATE TICKET
      // ==========================================

      .addCase(updateTicket.pending, (state) => {
        state.error = null;
      })

      .addCase(updateTicket.fulfilled, (state, action) => {
        state.error = null;

        const updatedTicket = action.payload;

        const index = state.tickets.findIndex(
          (ticket) => ticket.id === updatedTicket.id
        );

        if (index !== -1) {
          state.tickets[index] = updatedTicket;
        }
      })

      .addCase(updateTicket.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to update ticket.";
      })

      // ==========================================
      // 4. DELETE TICKET
      // ==========================================

      .addCase(deleteTicket.pending, (state) => {
        state.error = null;
      })

      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.error = null;

        state.tickets = state.tickets.filter(
          (ticket) => ticket.id !== action.payload
        );

        state.total = Math.max(0, state.total - 1);
      })

      .addCase(deleteTicket.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to delete ticket.";
      })

      // ==========================================
      // 5. ASSIGN TICKET
      // ==========================================

      .addCase(assignTicket.pending, (state) => {
        state.error = null;
      })

      .addCase(assignTicket.fulfilled, (state, action) => {
        state.error = null;

        const updatedTicket = action.payload;

        const index = state.tickets.findIndex(
          (ticket) => ticket.id === updatedTicket.id
        );

        if (index !== -1) {
          state.tickets[index] = updatedTicket;
        }
      })

      .addCase(assignTicket.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to assign ticket.";
      });
  },
});

export const {
  clearTicketError,
  clearTickets,
} = ticketSlice.actions;

export default ticketSlice.reducer;
