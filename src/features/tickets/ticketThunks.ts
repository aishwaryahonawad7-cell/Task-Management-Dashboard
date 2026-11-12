
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

import ticketService from "../../services/ticketService";

import type {
  Ticket,
  TicketFormData,
  TicketQueryParams,
  TicketListResponse,
} from "./ticket.types";

// ==========================================
// Common API error handler
// ==========================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") {
      return "Request cancelled";
    }

    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    if (!error.response) {
      return "Network error. Please check your connection.";
    }

    switch (error.response.status) {
      case 400:
        return "Invalid request. Please check your input.";

      case 401:
        return "Session expired. Please login again.";

      case 403:
        return "You are not authorized to perform this action.";

      case 404:
        return "Requested ticket was not found.";

      case 500:
        return "Internal server error. Please try again later.";

      default:
        return "Something went wrong. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

// ==========================================
// 1. Fetch tickets
// ==========================================

export const fetchTickets = createAsyncThunk<
  TicketListResponse,
  TicketQueryParams,
  { rejectValue: string }
>(
  "tickets/fetchTickets",
  async (params, { rejectWithValue, signal }) => {
    try {
      return await ticketService.getTickets(params, signal);
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==========================================
// 2. Create ticket
// ==========================================

export const createTicket = createAsyncThunk<
  Ticket,
  TicketFormData,
  { rejectValue: string }
>(
  "tickets/createTicket",
  async (data, { rejectWithValue }) => {
    try {
      return await ticketService.createTicket(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==========================================
// 3. Update ticket
// ==========================================

export const updateTicket = createAsyncThunk<
  Ticket,
  {
    id: string;
    data: Partial<TicketFormData>;
  },
  { rejectValue: string }
>(
  "tickets/updateTicket",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await ticketService.updateTicket(id, data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==========================================
// 4. Delete ticket
// ==========================================

export const deleteTicket = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "tickets/deleteTicket",
  async (id, { rejectWithValue }) => {
    try {
      return await ticketService.deleteTicket(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// ==========================================
// 5. Assign ticket
// ==========================================

export const assignTicket = createAsyncThunk<
  Ticket,
  {
    ticketId: string;
    agentId: string | null;
  },
  { rejectValue: string }
>(
  "tickets/assignTicket",
  async ({ ticketId, agentId }, { rejectWithValue }) => {
    try {
      return await ticketService.assignTicket(
        ticketId,
        agentId
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
