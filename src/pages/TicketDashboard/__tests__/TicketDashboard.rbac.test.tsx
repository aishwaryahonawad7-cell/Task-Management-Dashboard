
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse, delay } from "msw";
import {
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";

import { AuthProvider } from "../../../context/AuthContext";
import { renderWithProviders } from "../../../test/test-utils";
import { server } from "../../../test/mocks/server";
import TicketDashboard from "../TicketDashboard";

// --------------------------------------------------
// Test users
// --------------------------------------------------

type TestUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
};

const adminUser: TestUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
};

const managerUser: TestUser = {
  id: "manager-1",
  name: "Manager",
  email: "manager@example.com",
  role: "MANAGER",
};

const agentUser: TestUser = {
  id: "agent-1",
  name: "Agent",
  email: "agent@example.com",
  role: "AGENT",
};

// --------------------------------------------------
// Mock ticket
// --------------------------------------------------

const mockTicket = {
  id: "TKT-001",
  customerName: "John Doe",
  email: "john@example.com",
  subject: "Login issue",
  description: "Unable to log in to the application",
  priority: "High" as const,
  status: "Open" as const,
  assignedTo: "agent-1",
  createdAt: "2026-11-10T10:00:00.000Z",
};

// --------------------------------------------------
// Render helper
// --------------------------------------------------

const renderDashboard = (user: TestUser = adminUser) => {
  sessionStorage.clear();

  sessionStorage.setItem("support_auth", JSON.stringify(user));

  return renderWithProviders(
    <AuthProvider>
      <TicketDashboard />
    </AuthProvider>
  );
};

// --------------------------------------------------
// Test suite
// --------------------------------------------------

describe("TicketDashboard role-based interface", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();

    server.use(
      http.get(/\/tickets$/, () => {
        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      }),

      http.delete(/\/tickets\/[^/]+$/, () => {
        return new HttpResponse(null, { status: 200 });
      })
    );
  });

  // --------------------------------------------------
  // 1. Admin permissions
  // --------------------------------------------------

  it("shows the create-ticket action to Admin", async () => {
    renderDashboard(adminUser);

    expect(
      await screen.findByRole("button", {
        name: /create ticket/i,
      })
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 2. Manager permissions
  // --------------------------------------------------

  it("does not show create-ticket action to Manager", async () => {
    renderDashboard(managerUser);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: /create ticket/i,
        })
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------
  // 3. Agent permissions
  // --------------------------------------------------

  it("does not show create-ticket action to Agent", async () => {
    renderDashboard(agentUser);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: /create ticket/i,
        })
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------
  // 4. Logged-in user information
  // --------------------------------------------------

  it("displays the logged-in user's information", async () => {
    renderDashboard(adminUser);

    const userNames = await screen.findAllByText("Admin");

    expect(userNames.length).toBeGreaterThanOrEqual(1);
  });

  // --------------------------------------------------
  // 5. Open ticket form
  // --------------------------------------------------

  it("opens the ticket form for an Admin", async () => {
    renderDashboard(adminUser);

    const createButton = await screen.findByRole("button", {
      name: /create ticket/i,
    });

    fireEvent.click(createButton);

    expect(
      await screen.findByRole("heading", {
        name: "Create Ticket",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Customer Name")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Email")
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 6. Loading state
  // --------------------------------------------------

  it("shows the loading message while tickets are being fetched", async () => {
    server.use(
      http.get(/\/tickets$/, async () => {
        await delay(300);

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(adminUser);

    expect(
      screen.getByText(/loading tickets/i)
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 7. Empty state
  // --------------------------------------------------

  it("shows the empty message when no tickets are available", async () => {
    server.use(
      http.get(/\/tickets$/, () => {
        return HttpResponse.json([], {
          headers: {
            "x-total-count": "0",
          },
        });
      })
    );

    renderDashboard(adminUser);

    expect(
      await screen.findByText(/no tickets found/i)
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 8. API error
  // --------------------------------------------------

  it("displays an API error when ticket fetching fails", async () => {
    server.use(
      http.get(/\/tickets$/, () => {
        return HttpResponse.json(
          { message: "Internal server error" },
          { status: 500 }
        );
      })
    );

    renderDashboard(adminUser);

    expect(
      await screen.findByText(
        /internal server error\. please try again later/i
      )
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 9. Status filter
  // --------------------------------------------------

  it("sends the selected status filter to the API", async () => {
    let requestedStatus = "";

    server.use(
      http.get(/\/tickets$/, ({ request }) => {
        const url = new URL(request.url);
        requestedStatus = url.searchParams.get("status") ?? "";

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(adminUser);

    const statusFilter = await screen.findByLabelText(
      /filter by status/i
    );

    fireEvent.change(statusFilter, {
      target: { value: "Open" },
    });

    await waitFor(() => {
      expect(requestedStatus).toBe("Open");
    });
  });

  // --------------------------------------------------
  // 10. Priority filter
  // --------------------------------------------------

  it("sends the selected priority filter to the API", async () => {
    let requestedPriority = "";

    server.use(
      http.get(/\/tickets$/, ({ request }) => {
        const url = new URL(request.url);

        requestedPriority =
          url.searchParams.get("priority") ?? "";

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(adminUser);

    const priorityFilter = await screen.findByLabelText(
      /filter by priority/i
    );

    fireEvent.change(priorityFilter, {
      target: { value: "High" },
    });

    await waitFor(() => {
      expect(requestedPriority).toBe("High");
    });
  });

  // --------------------------------------------------
  // 11. Oldest-first sorting
  // --------------------------------------------------

  it("sends oldest-first sorting parameters to the API", async () => {
    let requestedSort = "";
    let requestedOrder = "";

    server.use(
      http.get(/\/tickets$/, ({ request }) => {
        const url = new URL(request.url);

        requestedSort = url.searchParams.get("_sort") ?? "";
        requestedOrder = url.searchParams.get("_order") ?? "";

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(adminUser);

    const sortFilter = await screen.findByLabelText(
      /sort tickets/i
    );

    fireEvent.change(sortFilter, {
      target: { value: "oldest" },
    });

    await waitFor(() => {
      expect(requestedSort).toBe("createdAt");
      expect(requestedOrder).toBe("asc");
    });
  });

  // --------------------------------------------------
  // 12. Priority sorting
  // --------------------------------------------------

  it("sends priority sorting parameters to the API", async () => {
    let requestedSort = "";
    let requestedOrder = "";

    server.use(
      http.get(/\/tickets$/, ({ request }) => {
        const url = new URL(request.url);

        requestedSort = url.searchParams.get("_sort") ?? "";
        requestedOrder = url.searchParams.get("_order") ?? "";

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(adminUser);

    const sortFilter = await screen.findByLabelText(
      /sort tickets/i
    );

    fireEvent.change(sortFilter, {
      target: { value: "priority" },
    });

    await waitFor(() => {
      expect(requestedSort).toBe("priority");
      expect(requestedOrder).toBe("asc");
    });
  });

  // --------------------------------------------------
  // 13. Debounced search
  // --------------------------------------------------

  it("sends the debounced search value to the API", async () => {
    let requestedSearch = "";

    server.use(
      http.get(/\/tickets$/, ({ request }) => {
        const url = new URL(request.url);

        requestedSearch = url.searchParams.get("q") ?? "";

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(adminUser);

    const searchInput = await screen.findByLabelText(
      /search tickets/i
    );

    fireEvent.change(searchInput, {
      target: { value: "Login issue" },
    });

    await waitFor(
      () => {
        expect(requestedSearch).toBe("Login issue");
      },
      { timeout: 3000 }
    );
  });

  // --------------------------------------------------
  // 14. Agent assigned tickets
  // --------------------------------------------------

  it("fetches only assigned tickets for an Agent", async () => {
    let requestedAgent = "";

    server.use(
      http.get(/\/tickets$/, ({ request }) => {
        const url = new URL(request.url);

        requestedAgent =
          url.searchParams.get("assignedTo") ?? "";

        return HttpResponse.json([mockTicket], {
          headers: {
            "x-total-count": "1",
          },
        });
      })
    );

    renderDashboard(agentUser);

    await waitFor(() => {
      expect(requestedAgent).toBe("agent-1");
    });
  });

  // --------------------------------------------------
  // 15. Delete confirmation
  // --------------------------------------------------

  it("asks for confirmation before deleting a ticket", async () => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(false);

    renderDashboard(adminUser);

    await screen.findByText("Login issue");

    const deleteButton = await screen.findByRole("button", {
      name: /delete/i,
    });

    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  // --------------------------------------------------
  // 16. Delete ticket successfully
  // --------------------------------------------------

  it("deletes a ticket after the Admin confirms", async () => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    let deleteCalled = false;

    server.use(
      http.delete(/\/tickets\/[^/]+$/, () => {
        deleteCalled = true;

        return new HttpResponse(null, { status: 200 });
      })
    );

    renderDashboard(adminUser);

    await screen.findByText("Login issue");

    const deleteButton = await screen.findByRole("button", {
      name: /delete/i,
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });

    confirmSpy.mockRestore();
  });

  // --------------------------------------------------
  // 17. Delete API error
  // --------------------------------------------------

  it("displays an error when deleting a ticket fails", async () => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    server.use(
      http.delete(/\/tickets\/[^/]+$/, () => {
        return HttpResponse.json(
          { message: "Internal server error" },
          { status: 500 }
        );
      })
    );

    renderDashboard(adminUser);

    await screen.findByText("Login issue");

    const deleteButton = await screen.findByRole("button", {
      name: /delete/i,
    });

    fireEvent.click(deleteButton);

    expect(
      await screen.findByText(
        /internal server error\. please try again later/i
      )
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  // --------------------------------------------------
  // 18. Manager can edit but cannot delete
  // --------------------------------------------------

  it("allows Manager to edit tickets but not delete them", async () => {
    renderDashboard(managerUser);

    await screen.findByText("Login issue");

    expect(
      screen.getByRole("button", {
        name: /^edit$/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /^delete$/i,
      })
    ).not.toBeInTheDocument();
  });

  // --------------------------------------------------
  // 19. Agent cannot edit or delete
  // --------------------------------------------------

  it("does not allow Agent to edit or delete tickets", async () => {
    renderDashboard(agentUser);

    await screen.findByText("Login issue");

    expect(
      screen.queryByRole("button", {
        name: /^edit$/i,
      })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /^delete$/i,
      })
    ).not.toBeInTheDocument();
  });

  // --------------------------------------------------
  // 20. Create ticket successfully
  // --------------------------------------------------

  it("creates a ticket successfully for Admin", async () => {
    let createdTicket: Record<string, unknown> | undefined;

    server.use(
      http.post(/\/tickets$/, async ({ request }) => {
        createdTicket =
          await request.json() as Record<string, unknown>;

        return HttpResponse.json(
          {
            ...createdTicket,
            id: "TKT-002",
            createdAt: "2026-11-11T10:00:00.000Z",
          },
          { status: 201 }
        );
      })
    );

    renderDashboard(adminUser);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /create ticket/i,
      })
    );

    await screen.findByRole("heading", {
      name: "Create Ticket",
    });

    fireEvent.change(screen.getByLabelText("Customer Name"), {
      target: { value: "Jane Doe" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Payment issue" },
    });

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Payment is not processing" },
    });

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /^create ticket$/i,
      }).at(-1)!
    );

    await waitFor(() => {
      expect(createdTicket).toBeDefined();
      expect(createdTicket?.customerName).toBe("Jane Doe");
      expect(createdTicket?.email).toBe("jane@example.com");
      expect(createdTicket?.subject).toBe("Payment issue");
      expect(createdTicket?.description).toBe(
        "Payment is not processing"
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Create Ticket",
        })
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------
  // 21. Create ticket API failure
  // --------------------------------------------------

  it("displays an API error when ticket creation fails", async () => {
    server.use(
      http.post(/\/tickets$/, () => {
        return HttpResponse.json(
          { message: "Internal server error" },
          { status: 500 }
        );
      })
    );

    renderDashboard(adminUser);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /create ticket/i,
      })
    );

    await screen.findByRole("heading", {
      name: "Create Ticket",
    });

    fireEvent.change(screen.getByLabelText("Customer Name"), {
      target: { value: "Jane Doe" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Payment issue" },
    });

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Payment is not processing" },
    });

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /^create ticket$/i,
      }).at(-1)!
    );

    expect(
      await screen.findByText(
        /internal server error\. please try again later/i
      )
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 22. Update ticket successfully
  // --------------------------------------------------

  it("updates an existing ticket successfully", async () => {
    let updatedTicket: Record<string, unknown> | undefined;

    server.use(
      http.patch(/\/tickets\/TKT-001$/, async ({ request }) => {
        updatedTicket =
          await request.json() as Record<string, unknown>;

        return HttpResponse.json({
          ...mockTicket,
          ...updatedTicket,
        });
      })
    );

    renderDashboard(adminUser);

    await screen.findByText("Login issue");

    fireEvent.click(
      screen.getByRole("button", {
        name: /^edit$/i,
      })
    );

    await screen.findByRole("heading", {
      name: "Update Ticket",
    });

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Updated login issue" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^update ticket$/i,
      })
    );

    await waitFor(() => {
      expect(updatedTicket).toBeDefined();
      expect(updatedTicket?.subject).toBe("Updated login issue");
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {
          name: "Update Ticket",
        })
      ).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------
  // 23. Update ticket API failure
  // --------------------------------------------------

  it("displays an API error when updating a ticket fails", async () => {
    server.use(
      http.patch(/\/tickets\/TKT-001$/, () => {
        return HttpResponse.json(
          { message: "Internal server error" },
          { status: 500 }
        );
      })
    );

    renderDashboard(adminUser);

    await screen.findByText("Login issue");

    fireEvent.click(
      screen.getByRole("button", {
        name: /^edit$/i,
      })
    );

    await screen.findByRole("heading", {
      name: "Update Ticket",
    });

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Updated login issue" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^update ticket$/i,
      })
    );

    expect(
      await screen.findByText(
        /internal server error\. please try again later/i
      )
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // 24. Cancel deletion
  // --------------------------------------------------

  it("does not delete a ticket when Admin cancels confirmation", async () => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(false);

    let deleteCalled = false;

    server.use(
      http.delete(/\/tickets\/[^/]+$/, () => {
        deleteCalled = true;

        return new HttpResponse(null, { status: 200 });
      })
    );

    renderDashboard(adminUser);

    await screen.findByText("Login issue");

    fireEvent.click(
      screen.getByRole("button", {
        name: /^delete$/i,
      })
    );

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteCalled).toBe(false);

    confirmSpy.mockRestore();
  });
});
