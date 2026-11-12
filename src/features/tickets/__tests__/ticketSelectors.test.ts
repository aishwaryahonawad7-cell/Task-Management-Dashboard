import { describe, expect, it } from "vitest";

import {
  selectTickets,
  selectTicketLoading,
  selectTicketError,
  selectTicketTotal,
} from "../ticketSelectors";

import type { RootState } from "../../../app/store";

import { mockTicket } from "./ticketFixtures";

const mockState = {
  tickets: {
    tickets: [mockTicket],
    total: 1,
    loading: false,
    error: null,
  },
} as RootState;

describe("Ticket selectors", () => {

  it("should return all tickets", () => {
    const result = selectTickets(mockState);

    expect(result).toEqual([mockTicket]);
  });

  it("should return loading state", () => {
    const result = selectTicketLoading(mockState);

    expect(result).toBe(false);
  });

  it("should return ticket error", () => {
    const errorState = {
      ...mockState,
      tickets: {
        ...mockState.tickets,
        error: "Something went wrong",
      },
    };

    expect(selectTicketError(errorState)).toBe(
      "Something went wrong"
    );
  });

  it("should return total ticket count", () => {
    const result = selectTicketTotal(mockState);

    expect(result).toBe(1);
  });

});