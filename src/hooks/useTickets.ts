
import { useEffect, useState } from "react";

import type {
  Ticket,
  TicketFormData,
} from "../types/ticket.types";

import ticketService from "../services/ticketService";

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // GET ALL TICKETS
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ticketService.getTickets({});

      setTickets(response.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to fetch tickets"
      );
    } finally {
      setLoading(false);
    }
  };

  // INITIAL API CALL
  useEffect(() => {
    let ignore = false;

    async function loadTickets() {
      try {
        setLoading(true);
        setError(null);

        const response = await ticketService.getTickets({});

        if (!ignore) {
          setTickets(response.data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to fetch tickets"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadTickets();

    return () => {
      ignore = true;
    };
  }, []);

  // CREATE TICKET
  const addTicket = async (data: TicketFormData) => {
    try {
      setError(null);

      const newTicket = await ticketService.createTicket(data);

      setTickets((previous) => [
        newTicket,
        ...previous,
      ]);

      return true;
    } catch {
      setError("Unable to create ticket");
      return false;
    }
  };

  // UPDATE TICKET
  const editTicket = async (
    id: string,
    data: TicketFormData
  ) => {
    try {
      setError(null);

      const updatedTicket = await ticketService.updateTicket(id, data);

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === id ? updatedTicket : ticket
        )
      );

      return true;
    } catch {
      setError("Unable to update ticket");
      return false;
    }
  };

  // DELETE TICKET
  const removeTicket = async (id: string) => {
    try {
      setError(null);

      await ticketService.deleteTicket(id);

      setTickets((previous) =>
        previous.filter((ticket) => ticket.id !== id)
      );

      return true;
    } catch {
      setError("Unable to delete ticket");
      return false;
    }
  };

  return {
    tickets,
    loading,
    error,
    addTicket,
    editTicket,
    removeTicket,
    fetchTickets,
  };
}
