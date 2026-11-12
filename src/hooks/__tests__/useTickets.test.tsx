
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import ticketService from "../../services/ticketService";
import { useTickets } from "../useTickets";

import type { Ticket, TicketFormData } from "../../types/ticket.types";

vi.mock("../../services/ticketService", () => ({
  default: {
    getTickets: vi.fn(),
    createTicket: vi.fn(),
    updateTicket: vi.fn(),
    deleteTicket: vi.fn(),
  },
}));

// Test ticket data
const createMockTicket = (id: string): Ticket =>
  ({
    id,
    customerName: "Test Customer",
    email: "test@example.com",
    subject: "Test Subject",
    description: "Test Description",
    priority: "Medium",
    status: "Open",
    assignedTo: null,
    createdAt: "2026-11-11T10:00:00.000Z",
  }) as Ticket;

// Test form data
const mockFormData = {
  customerName: "Updated Customer",
  email: "updated@example.com",
  subject: "Updated Subject",
  description: "Updated Description",
  priority: "High",
  status: "Open",
  assignedTo: null,
} as TicketFormData;

describe("useTickets hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ticketService.getTickets).mockResolvedValue({
      data: [],
      total: 0,
    });
  });

  // INITIAL FETCH

  it("initially loads tickets from the API", async () => {
    const tickets = [createMockTicket("TKT-1")];

    vi.mocked(ticketService.getTickets).mockResolvedValueOnce({
      data: tickets,
      total: 1,
    });

    const { result } = renderHook(() => useTickets());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toEqual(tickets);
    expect(result.current.error).toBeNull();
    expect(ticketService.getTickets).toHaveBeenCalled();
  });

  it("sets an error when initial ticket loading fails", async () => {
    vi.mocked(ticketService.getTickets).mockRejectedValueOnce(
      new Error("Server error")
    );

    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.tickets).toEqual([]);
  });

  it("uses fallback error when initial fetch rejects with a non-Error value", async () => {
    vi.mocked(ticketService.getTickets).mockRejectedValueOnce("Failed");

    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Unable to fetch tickets");
  });

  // MANUAL FETCH

  it("fetches tickets when fetchTickets is called", async () => {
    const tickets = [createMockTicket("TKT-2")];

    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.getTickets).mockResolvedValueOnce({
      data: tickets,
      total: 1,
    });

    await act(async () => {
      await result.current.fetchTickets();
    });

    expect(result.current.tickets).toEqual(tickets);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets an error when manual fetching fails", async () => {
    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.getTickets).mockRejectedValueOnce(
      new Error("Unable to connect")
    );

    await act(async () => {
      await result.current.fetchTickets();
    });

    expect(result.current.error).toBe("Unable to connect");
    expect(result.current.loading).toBe(false);
  });

  it("uses fallback error for non-Error manual fetch failures", async () => {
    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.getTickets).mockRejectedValueOnce("Failed");

    await act(async () => {
      await result.current.fetchTickets();
    });

    expect(result.current.error).toBe("Unable to fetch tickets");
  });

  // CREATE TICKET

  it("creates a ticket successfully", async () => {
    const newTicket = createMockTicket("TKT-3");

    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.createTicket).mockResolvedValueOnce(newTicket);

    let success = false;

    await act(async () => {
      success = await result.current.addTicket(mockFormData);
    });

    expect(success).toBe(true);
    expect(result.current.tickets).toContainEqual(newTicket);
    expect(result.current.error).toBeNull();
  });

  it("sets an error when ticket creation fails", async () => {
    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.createTicket).mockRejectedValueOnce(
      new Error("Create failed")
    );

    let success = true;

    await act(async () => {
      success = await result.current.addTicket(mockFormData);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Unable to create ticket");
  });

  // UPDATE TICKET

  it("updates an existing ticket successfully", async () => {
    const originalTicket = createMockTicket("TKT-4");
    const updatedTicket = {
      ...originalTicket,
      subject: "Updated Subject",
    };

    vi.mocked(ticketService.getTickets).mockResolvedValueOnce({
      data: [originalTicket],
      total: 1,
    });

    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.tickets).toHaveLength(1);
    });

    vi.mocked(ticketService.updateTicket).mockResolvedValueOnce(
      updatedTicket
    );

    let success = false;

    await act(async () => {
      success = await result.current.editTicket(
        "TKT-4",
        mockFormData
      );
    });

    expect(success).toBe(true);
    expect(result.current.tickets[0]).toEqual(updatedTicket);
    expect(result.current.error).toBeNull();
  });

  it("sets an error when ticket updating fails", async () => {
    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.updateTicket).mockRejectedValueOnce(
      new Error("Update failed")
    );

    let success = true;

    await act(async () => {
      success = await result.current.editTicket(
        "TKT-4",
        mockFormData
      );
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Unable to update ticket");
  });

  // DELETE TICKET

  it("deletes a ticket successfully", async () => {
    const firstTicket = createMockTicket("TKT-5");
    const secondTicket = createMockTicket("TKT-6");

    vi.mocked(ticketService.getTickets).mockResolvedValueOnce({
      data: [firstTicket, secondTicket],
      total: 2,
    });

    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.tickets).toHaveLength(2);
    });

    vi.mocked(ticketService.deleteTicket).mockResolvedValueOnce("TKT-5");

    let success = false;

    await act(async () => {
      success = await result.current.removeTicket("TKT-5");
    });

    expect(success).toBe(true);
    expect(result.current.tickets).toEqual([secondTicket]);
    expect(result.current.error).toBeNull();
  });

  it("sets an error when ticket deletion fails", async () => {
    const { result } = renderHook(() => useTickets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    vi.mocked(ticketService.deleteTicket).mockRejectedValueOnce(
      new Error("Delete failed")
    );

    let success = true;

    await act(async () => {
      success = await result.current.removeTicket("TKT-5");
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Unable to delete ticket");
  });
});
