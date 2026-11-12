
import type { Ticket } from "../../features/tickets/ticket.types";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";

interface TicketTableProps {
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  onUpdateStatus?: (ticket: Ticket) => void;

  selectedIds?: string[];
  onToggleSelection?: (id: string, checked: boolean) => void;
  onToggleAllSelection?: (
    ids: string[],
    checked: boolean
  ) => void;
}

function TicketTable({
  tickets,
  onEdit,
  onDelete,
  onUpdateStatus,
  selectedIds = [],
  onToggleSelection,
  onToggleAllSelection,
}: TicketTableProps) {
  const { can } = usePermissions();
  const { user } = useAuth();

  if (tickets.length === 0) {
    return (
      <p className="empty-state">
        No tickets found.
      </p>
    );
  }

  const canSelectTickets = Boolean(
    onToggleSelection && onToggleAllSelection
  );

  // Check which tickets the current user can manage.
  const selectableTickets = tickets.filter((ticket) => {
    const canViewAll = can("VIEW_ALL_TICKETS");

    const isAssignedToUser =
      ticket.assignedTo === user?.id;

    const canAccessTicket =
      canViewAll ||
      (
        can("VIEW_ASSIGNED_TICKETS") &&
        isAssignedToUser
      );

    return (
      can("MANAGE_STATUS") &&
      canAccessTicket
    );
  });

  const allVisibleSelected =
    selectableTickets.length > 0 &&
    selectableTickets.every((ticket) =>
      selectedIds.includes(ticket.id)
    );

  function handleSelectAll(checked: boolean) {
    onToggleAllSelection?.(
      selectableTickets.map((ticket) => ticket.id),
      checked
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {canSelectTickets && (
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all visible tickets"
                  checked={allVisibleSelected}
                  disabled={selectableTickets.length === 0}
                  onChange={(event) =>
                    handleSelectAll(event.target.checked)
                  }
                />
              </th>
            )}

            <th>Ticket ID</th>
            <th>Customer</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => {
            const canViewAll = can("VIEW_ALL_TICKETS");

            const isAssignedToUser =
              ticket.assignedTo === user?.id;

            const canAccessTicket =
              canViewAll ||
              (
                can("VIEW_ASSIGNED_TICKETS") &&
                isAssignedToUser
              );

            const canEdit =
              can("UPDATE_TICKET") &&
              canAccessTicket;

            const canUpdateStatus =
              can("MANAGE_STATUS") &&
              canAccessTicket;

            const canDelete =
              can("DELETE_TICKET");

            const canSelect =
              canSelectTickets && canUpdateStatus;

            return (
              <tr key={ticket.id}>
                {canSelectTickets && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ticket ${ticket.id}`}
                      checked={selectedIds.includes(ticket.id)}
                      disabled={!canSelect}
                      onChange={(event) =>
                        onToggleSelection?.(
                          ticket.id,
                          event.target.checked
                        )
                      }
                    />
                  </td>
                )}

                <td>{ticket.id}</td>

                <td>{ticket.customerName}</td>

                <td>{ticket.subject}</td>

                <td>
                  <span
                    className={`priority ${ticket.priority.toLowerCase()}`}
                  >
                    {ticket.priority}
                  </span>
                </td>

                <td>
                  <span
                    className={`status ${ticket.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {ticket.status}
                  </span>
                </td>

                <td>
                  {ticket.createdAt
                    ? new Date(
                        ticket.createdAt
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  <div className="ticket-actions">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(ticket)}
                      >
                        Edit
                      </button>
                    )}

                    {canUpdateStatus && onUpdateStatus && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStatus(ticket)
                        }
                      >
                        Update Status
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          onDelete(ticket.id)
                        }
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TicketTable;
