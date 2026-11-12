
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { useDebounce } from "../../hooks/useDebounce";

import Header from "../../components/Header/Header";
import SearchBar from "../../components/SearchBar/SearchBar";
import TicketTable from "../../components/TicketTable/TicketTable";
import Pagination from "../../components/Pagination/Pagination";
import TicketForm from "../../components/TicketForm/TicketForm";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../../features/tickets/ticketThunks";

import {
  selectTickets,
  selectTicketLoading,
  selectTicketError,
  selectTicketTotal,
} from "../../features/tickets/ticketSelectors";

import {
  useBulkUpdateTicketStatusMutation,
  useBulkAssignTicketsMutation,
} from "../../features/tickets/ticketApi";

import type {
  Ticket,
  TicketFormData,
  TicketPriority,
  TicketStatus,
  TicketQueryParams,
} from "../../features/tickets/ticket.types";

import "./TicketDashboard.css";

type SortOption = "newest" | "oldest" | "priority";

function TicketDashboard() {
  const dispatch = useAppDispatch();

  // Redux state
  const tickets = useAppSelector(selectTickets);
  const loading = useAppSelector(selectTicketLoading);
  const error = useAppSelector(selectTicketError);
  const total = useAppSelector(selectTicketTotal);

  // RTK Query bulk mutations
  const [
    bulkUpdateTicketStatus,
    { isLoading: isBulkStatusLoading },
  ] = useBulkUpdateTicketStatusMutation();

  const [
    bulkAssignTickets,
    { isLoading: isBulkAssignLoading },
  ] = useBulkAssignTicketsMutation();

  // Authentication and permissions
  const { user } = useAuth();
  const { can } = usePermissions();

  const canViewAll = can("VIEW_ALL_TICKETS");
  const canViewAssigned = can("VIEW_ASSIGNED_TICKETS");

  const hasViewPermission =
    canViewAll || canViewAssigned;

  // Search and filters
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "All" | TicketStatus
  >("All");

  const [priority, setPriority] = useState<
    "All" | TicketPriority
  >("All");

  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Ticket selection
  const [selectedTicketIds, setSelectedTicketIds] =
    useState<string[]>([]);

  // Bulk action values
  const [bulkStatus, setBulkStatus] =
    useState<TicketStatus>("In Progress");

  // Existing mock agent from authService.ts:
  // Agent User, ID "3".
  const [bulkAgentId, setBulkAgentId] = useState("3");

  // Form
  const [showForm, setShowForm] = useState(false);

  const [selectedTicket, setSelectedTicket] =
    useState<Ticket | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 500);

  const isBulkLoading =
    isBulkStatusLoading || isBulkAssignLoading;

  // Convert UI sorting options into API parameters
  const getSortParams = useCallback((): Pick<
    TicketQueryParams,
    "sortBy" | "order"
  > => {
    if (sortBy === "oldest") {
      return {
        sortBy: "createdAt",
        order: "asc",
      };
    }

    if (sortBy === "priority") {
      return {
        sortBy: "priority",
        order: "asc",
      };
    }

    return {
      sortBy: "createdAt",
      order: "desc",
    };
  }, [sortBy]);

  // Build API query parameters
  const buildQueryParams = useCallback(
    (page: number): TicketQueryParams => ({
      page,
      limit: pageSize,
      search: debouncedSearch.trim() || undefined,
      status: status === "All" ? undefined : status,
      priority: priority === "All" ? undefined : priority,
      ...getSortParams(),

      assignedTo:
        !canViewAll && canViewAssigned
          ? user?.id
          : undefined,
    }),
    [
      pageSize,
      debouncedSearch,
      status,
      priority,
      getSortParams,
      canViewAll,
      canViewAssigned,
      user?.id,
    ]
  );

  // Fetch tickets when filters or pagination change
  useEffect(() => {
    if (!user || !hasViewPermission) {
      return;
    }

    const request = dispatch(
      fetchTickets(buildQueryParams(currentPage))
    );

    return () => {
      request.abort();
    };
  }, [
    dispatch,
    user,
    hasViewPermission,
    currentPage,
    buildQueryParams,
  ]);

  // Server-side pagination
  const totalPages = Math.ceil(total / pageSize);

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const firstTicket =
    total === 0
      ? 0
      : (safeCurrentPage - 1) * pageSize + 1;

  const lastTicket = Math.min(
    safeCurrentPage * pageSize,
    total
  );

  // Refresh the current ticket list
  function refreshTickets() {
    dispatch(
      fetchTickets(buildQueryParams(currentPage))
    );
  }

  // Remove successful IDs from selection.
  // Failed IDs remain selected for retry.
  function updateSelectionAfterBulkAction(
    failedIds: string[]
  ) {
    setSelectedTicketIds(failedIds);
  }

  // Select or unselect one ticket
  function handleToggleSelection(
    id: string,
    checked: boolean
  ) {
    setSelectedTicketIds((previous) => {
      if (checked) {
        return previous.includes(id)
          ? previous
          : [...previous, id];
      }

      return previous.filter(
        (ticketId) => ticketId !== id
      );
    });
  }

  // Select or unselect all eligible tickets on current page
  function handleToggleAllSelection(
    ids: string[],
    checked: boolean
  ) {
    setSelectedTicketIds((previous) => {
      if (checked) {
        return Array.from(
          new Set([...previous, ...ids])
        );
      }

      return previous.filter(
        (id) => !ids.includes(id)
      );
    });
  }

  function handleClearSelection() {
    setSelectedTicketIds([]);
  }

  // Bulk status update
  async function handleBulkStatusUpdate() {
    if (!can("MANAGE_STATUS")) {
      window.alert(
        "You do not have permission to update ticket status."
      );
      return;
    }

    if (selectedTicketIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Change the status of ${selectedTicketIds.length} selected ticket(s) to "${bulkStatus}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await bulkUpdateTicketStatus({
        ticketIds: selectedTicketIds,
        status: bulkStatus,
        queryArgs: buildQueryParams(currentPage),
      }).unwrap();

      const failedIds = result.failed.map(
        (item) => item.ticketId
      );

      updateSelectionAfterBulkAction(failedIds);
      refreshTickets();

      if (result.failed.length > 0) {
        window.alert(
          `${result.succeeded.length} ticket(s) updated successfully.\n` +
          `${result.failed.length} ticket(s) failed.\n\n` +
          result.failed
            .map(
              (item) =>
                `${item.ticketId}: ${item.error}`
            )
            .join("\n")
        );
      } else {
        window.alert(
          `${result.succeeded.length} ticket(s) updated successfully.`
        );
      }
    } catch (error) {
      console.error("Bulk status update failed:", error);

      refreshTickets();

      window.alert(
        "Unable to update the selected tickets. Please try again."
      );
    }
  }

  // Bulk ticket assignment
  async function handleBulkAssignment() {
    if (!can("ASSIGN_TICKET")) {
      window.alert(
        "You do not have permission to assign tickets."
      );
      return;
    }

    if (selectedTicketIds.length === 0) {
      return;
    }

    const agentName =
      bulkAgentId === ""
        ? "Unassigned"
        : "Agent User";

    const confirmed = window.confirm(
      `Assign ${selectedTicketIds.length} selected ticket(s) to ${agentName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const result = await bulkAssignTickets({
        ticketIds: selectedTicketIds,
        agentId: bulkAgentId || null,
      }).unwrap();

      const failedIds = result.failed.map(
        (item) => item.ticketId
      );

      updateSelectionAfterBulkAction(failedIds);
      refreshTickets();

      if (result.failed.length > 0) {
        window.alert(
          `${result.succeeded.length} ticket(s) assigned successfully.\n` +
          `${result.failed.length} ticket(s) failed.\n\n` +
          result.failed
            .map(
              (item) =>
                `${item.ticketId}: ${item.error}`
            )
            .join("\n")
        );
      } else {
        window.alert(
          `${result.succeeded.length} ticket(s) assigned successfully.`
        );
      }
    } catch (error) {
      console.error("Bulk assignment failed:", error);

      refreshTickets();

      window.alert(
        "Unable to assign the selected tickets. Please try again."
      );
    }
  }

  // Search and filter changes
  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value as "All" | TicketStatus);
    setCurrentPage(1);
  }

  function handlePriorityChange(value: string) {
    setPriority(value as "All" | TicketPriority);
    setCurrentPage(1);
  }

  function handleSortChange(value: string) {
    setSortBy(value as SortOption);
    setCurrentPage(1);
  }

  // Create or update ticket
  async function handleFormSubmit(data: TicketFormData) {
    if (!selectedTicket && !can("CREATE_TICKET")) {
      return;
    }

    if (selectedTicket && !can("UPDATE_TICKET")) {
      return;
    }

    try {
      if (selectedTicket) {
        await dispatch(
          updateTicket({
            id: selectedTicket.id,
            data,
          })
        ).unwrap();
      } else {
        await dispatch(createTicket(data)).unwrap();
      }

      setShowForm(false);
      setSelectedTicket(undefined);
      setCurrentPage(1);

      dispatch(
        fetchTickets(buildQueryParams(1))
      );
    } catch {
      // Redux stores the error.
    }
  }

  // Open create form
  function handleCreateTicket() {
    if (!can("CREATE_TICKET")) {
      return;
    }

    setSelectedTicket(undefined);
    setShowForm(true);
  }

  // Open edit form
  function handleEditTicket(ticket: Ticket) {
    if (!can("UPDATE_TICKET")) {
      return;
    }

    setSelectedTicket(ticket);
    setShowForm(true);
  }

  // Delete ticket
  async function handleDeleteTicket(id: string) {
    if (!can("DELETE_TICKET")) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this ticket?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(deleteTicket(id)).unwrap();

      setSelectedTicketIds((previous) =>
        previous.filter((ticketId) => ticketId !== id)
      );

      const nextPage =
        tickets.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      setCurrentPage(nextPage);

      if (nextPage === currentPage) {
        dispatch(
          fetchTickets(buildQueryParams(currentPage))
        );
      }
    } catch {
      // Redux stores the delete error.
    }
  }

  function handleCancelForm() {
    setShowForm(false);
    setSelectedTicket(undefined);
  }

  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard-container">
        {/* Dashboard heading */}
        <div className="dashboard-heading">
          <div>
            <h1>Customer Support Tickets</h1>

            <p>
              Manage and track customer support requests.
            </p>

            {user && (
              <p>
                Logged in as:{" "}
                <strong>{user.name}</strong>{" "}
                ({user.role})
              </p>
            )}
          </div>

          {can("CREATE_TICKET") && (
            <button
              type="button"
              className="create-ticket-btn"
              onClick={handleCreateTicket}
            >
              + Create Ticket
            </button>
          )}
        </div>

        {/* Search and filters */}
        <div className="filter-section">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
          />

          <select
            value={status}
            onChange={(event) =>
              handleStatusChange(event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={(event) =>
              handlePriorityChange(event.target.value)
            }
            aria-label="Filter by priority"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) =>
              handleSortChange(event.target.value)
            }
            aria-label="Sort tickets"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* Permission message */}
        {!hasViewPermission && (
          <div className="error-message" role="alert">
            You do not have permission to view tickets.
          </div>
        )}

        {/* API error */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-message">
            Loading tickets...
          </div>
        )}

        {/* Ticket list */}
        {!loading && hasViewPermission && (
          <>
            <div className="ticket-count">
              Showing {firstTicket} - {lastTicket} of{" "}
              {total} tickets
            </div>

            {/* Bulk actions */}
            {selectedTicketIds.length > 0 && (
              <div className="bulk-actions-panel">
                <div className="bulk-actions-header">
                  <strong>
                    {selectedTicketIds.length} ticket(s) selected
                  </strong>

                  <button
                    type="button"
                    className="bulk-clear-btn"
                    onClick={handleClearSelection}
                    disabled={isBulkLoading}
                  >
                    Clear Selection
                  </button>
                </div>

                {can("MANAGE_STATUS") && (
                  <div className="bulk-action-group">
                    <label htmlFor="bulk-status">
                      Change status
                    </label>

                    <select
                      id="bulk-status"
                      value={bulkStatus}
                      onChange={(event) =>
                        setBulkStatus(
                          event.target.value as TicketStatus
                        )
                      }
                      disabled={isBulkLoading}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">
                        In Progress
                      </option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                    <button
                      type="button"
                      className="bulk-action-btn"
                      onClick={handleBulkStatusUpdate}
                      disabled={isBulkLoading}
                    >
                      {isBulkStatusLoading
                        ? "Updating..."
                        : "Apply Status"}
                    </button>
                  </div>
                )}

                {can("ASSIGN_TICKET") && (
                  <div className="bulk-action-group">
                    <label htmlFor="bulk-agent">
                      Assign to
                    </label>

                    <select
                      id="bulk-agent"
                      value={bulkAgentId}
                      onChange={(event) =>
                        setBulkAgentId(event.target.value)
                      }
                      disabled={isBulkLoading}
                    >
                      <option value="3">Agent User</option>
                      <option value="">Unassigned</option>
                    </select>

                    <button
                      type="button"
                      className="bulk-action-btn"
                      onClick={handleBulkAssignment}
                      disabled={isBulkLoading}
                    >
                      {isBulkAssignLoading
                        ? "Assigning..."
                        : "Apply Assignment"}
                    </button>
                  </div>
                )}

                {isBulkLoading && (
                  <p className="bulk-loading-message">
                    Please wait. Updating selected tickets...
                  </p>
                )}
              </div>
            )}

            {tickets.length === 0 ? (
              <div className="empty-message">
                No tickets found.
              </div>
            ) : (
              <>
                <TicketTable
                  tickets={tickets}
                  onEdit={handleEditTicket}
                  onDelete={handleDeleteTicket}
                  selectedIds={selectedTicketIds}
                  onToggleSelection={handleToggleSelection}
                  onToggleAllSelection={
                    handleToggleAllSelection
                  }
                />

                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <TicketForm
              key={selectedTicket?.id ?? "new-ticket"}
              initialData={selectedTicket}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDashboard;
