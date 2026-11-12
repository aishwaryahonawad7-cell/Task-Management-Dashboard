
import type { Ticket } from "../../features/tickets/ticket.types";

import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";

interface TicketTableProps {
  tickets: Ticket[];
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  onUpdateStatus?: (ticket: Ticket) => void;
}

function TicketTable({
  tickets,
  onEdit,
  onDelete,
  onUpdateStatus,
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

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
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
            // Check whether the user can view all tickets.
            const canViewAll = can("VIEW_ALL_TICKETS");

            // Check whether the ticket belongs to the current agent.
            const isAssignedToUser =
              ticket.assignedTo === user?.id;

            // Admin/manager or assigned agent can edit,
            // provided the permission is granted.
            const canEdit =
              can("UPDATE_TICKET") &&
              (canViewAll ||
                (can("VIEW_ASSIGNED_TICKETS") &&
                  isAssignedToUser));

            // Assigned agents and authorized managers
            // can update ticket status.
            const canUpdateStatus =
              can("MANAGE_STATUS") &&
              (canViewAll ||
                (can("VIEW_ASSIGNED_TICKETS") &&
                  isAssignedToUser));

            // Delete permission is checked separately.
            const canDelete = can("DELETE_TICKET");

            return (
              <tr key={ticket.id}>
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
