
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

  // Authentication and permissions
  const { user } = useAuth();
  const { can } = usePermissions();

  const canViewAll = can("VIEW_ALL_TICKETS");
  const canViewAssigned = can("VIEW_ASSIGNED_TICKETS");

  const hasViewPermission = canViewAll || canViewAssigned;

  // Search, filters and sorting
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "All" | TicketStatus
  >("All");

  const [priority, setPriority] = useState<
    "All" | TicketPriority
  >("All");

  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Form
  const [showForm, setShowForm] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<
    Ticket | undefined
  >(undefined);

  // Debounced search
  const debouncedSearch = useDebounce(search, 500);

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

      // Agents only receive their assigned tickets.
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

  // Fetch tickets whenever filters, sorting,
  // pagination or permissions change.
  useEffect(() => {
    if (!user || !hasViewPermission) {
      return;
    }

    const request = dispatch(
      fetchTickets(buildQueryParams(currentPage))
    );

    // Cancel previous request on dependency change/unmount.
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

  // Reset pagination when search or filters change.
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

      // Refresh the first page after saving.
      setCurrentPage(1);

      if (currentPage === 1) {
        dispatch(fetchTickets(buildQueryParams(1)));
      }
    } catch {
      // Redux stores the error and displays it below.
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

  // Cancel form
  function handleCancelForm() {
    setShowForm(false);
    setSelectedTicket(undefined);
  }

  return (
    <div className="dashboard">
      <Header />

      <main className="dashboard-container">

        {/* Dashboard Heading */}
        <div className="dashboard-heading">
          <div>
            <h1>Customer Support Tickets</h1>

            <p>
              Manage and track customer support requests.
            </p>

            {user && (
              <p>
                Logged in as: <strong>{user.name}</strong>{" "}
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

        {/* Search and Filters */}
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

        {/* Permission Message */}
        {!hasViewPermission && (
          <div className="error-message" role="alert">
            You do not have permission to view tickets.
          </div>
        )}

        {/* API Error */}
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

        {/* Ticket List */}
        {!loading && hasViewPermission && (
          <>
            <div className="ticket-count">
              Showing {firstTicket} - {lastTicket} of{" "}
              {total} tickets
            </div>

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

      {/* Create / Edit Modal */}
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
