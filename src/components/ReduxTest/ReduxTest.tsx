
import { useEffect } from "react";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  fetchTickets,
} from "../../features/tickets/ticketThunks";

import {
  selectTickets,
  selectTicketLoading,
  selectTicketError,
} from "../../features/tickets/ticketSelectors";

function ReduxTest() {
  const dispatch = useAppDispatch();

  const tickets = useAppSelector(selectTickets);
  const loading = useAppSelector(selectTicketLoading);
  const error = useAppSelector(selectTicketError);

  useEffect(() => {
    const request = dispatch(
      fetchTickets({
        page: 1,
        limit: 5,
        order: "desc",
        sortBy: "createdAt",
      })
    );

    return () => {
      request.abort();
    };
  }, [dispatch]);

  if (loading) {
    return <p>Loading tickets...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (tickets.length === 0) {
    return <p>No tickets found.</p>;
  }

  return (
    <div>
      <h2>Redux Ticket List</h2>

      {tickets.map((ticket) => (
        <div key={ticket.id}>
          <h3>{ticket.subject}</h3>
          <p>{ticket.customerName}</p>
          <p>{ticket.status}</p>
        </div>
      ))}
    </div>
  );
}

export default ReduxTest;
