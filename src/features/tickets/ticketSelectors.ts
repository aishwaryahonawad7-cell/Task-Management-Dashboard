
import type { RootState } from "../../app/store";

// Get all tickets
export const selectTickets = (state: RootState) =>
  state.tickets.tickets;

// Get loading state
export const selectTicketLoading = (state: RootState) =>
  state.tickets.loading;

// Get API error
export const selectTicketError = (state: RootState) =>
  state.tickets.error;

// Get total ticket count
export const selectTicketTotal = (state: RootState) =>
  state.tickets.total;
