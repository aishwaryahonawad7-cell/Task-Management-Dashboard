import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/mocks/server";
import apiClient from "../../../services/apiClient";
import { createTestStore } from "./testStore";
import { fetchTickets, createTicket, updateTicket, deleteTicket } from "../ticketThunks";
import { mockTicket, mockTicketForm } from "./ticketFixtures";

afterEach(() => {
  apiClient.defaults.timeout = 10000;
  vi.restoreAllMocks();
});

describe("Ticket API integration", () => {
  it.each([400, 401, 403, 404, 500])("maps HTTP %s responses to Redux errors", async (status) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("*/tickets", () => HttpResponse.json({ message: "failure" }, { status })));
    const store = createTestStore();
    await store.dispatch(fetchTickets({ page: 1, limit: 5 }));
    expect(store.getState().tickets.loading).toBe(false);
    expect(store.getState().tickets.error).toBeTruthy();
  });

  it("handles a network-level failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("*/tickets", () => HttpResponse.error()));
    const store = createTestStore();
    await store.dispatch(fetchTickets({}));
    expect(store.getState().tickets.error).toMatch(/network/i);
  });

  it("handles an Axios timeout", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.defaults.timeout = 40;
    server.use(http.get("*/tickets", async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return HttpResponse.json([]);
    }));
    const store = createTestStore();
    await store.dispatch(fetchTickets({}));
    expect(store.getState().tickets.error).toMatch(/timed out/i);
  });

  it("sends the expected search, filter, sort and pagination query parameters", async () => {
    let requestUrl = "";
    server.use(http.get("*/tickets", ({ request }) => {
      requestUrl = request.url;
      return HttpResponse.json([mockTicket], { headers: { "x-total-count": "1" } });
    }));
    await createTestStore().dispatch(fetchTickets({
      search: "Login", status: "Open", priority: "High", assignedTo: "agent-1",
      sortBy: "createdAt", order: "desc", page: 2, limit: 10,
    }));
    const params = new URL(requestUrl).searchParams;
    expect(params.get("q")).toBe("Login");
    expect(params.get("status")).toBe("Open");
    expect(params.get("priority")).toBe("High");
    expect(params.get("assignedTo")).toBe("agent-1");
    expect(params.get("_sort")).toBe("createdAt");
    expect(params.get("_order")).toBe("desc");
    expect(params.get("_page")).toBe("2");
    expect(params.get("_limit")).toBe("10");
  });

  it("sends the expected POST payload when creating a ticket", async () => {
    let posted: unknown;
    server.use(http.post("*/tickets", async ({ request }) => {
      posted = await request.json();
      return HttpResponse.json({ ...posted as object, id: "TKT-NEW" }, { status: 201 });
    }));
    const result = await createTestStore().dispatch(createTicket(mockTicketForm));
    expect(result.meta.requestStatus).toBe("fulfilled");
    expect(posted).toMatchObject({ customerName: "Priya Sharma", subject: "Payment issue" });
  });

  it("sends the expected PATCH payload when updating a ticket", async () => {
    let patched: unknown;
    server.use(http.patch("*/tickets/:id", async ({ request }) => {
      patched = await request.json();
      return HttpResponse.json({ ...mockTicket, status: "Resolved" });
    }));
    const result = await createTestStore().dispatch(updateTicket({ id: mockTicket.id, data: { status: "Resolved" } }));
    expect(result.meta.requestStatus).toBe("fulfilled");
    expect(patched).toEqual({ status: "Resolved" });
  });

  it("sends DELETE for the requested ticket", async () => {
    let url = "";
    server.use(http.delete("*/tickets/:id", ({ request }) => {
      url = request.url;
      return new HttpResponse(null, { status: 204 });
    }));
    const result = await createTestStore().dispatch(deleteTicket(mockTicket.id));
    expect(result.meta.requestStatus).toBe("fulfilled");
    expect(url).toContain(`/tickets/${mockTicket.id}`);
  });

  it("aborts an in-flight request and ignores its rejection as a user-facing error", async () => {
    server.use(http.get("*/tickets", async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return HttpResponse.json([]);
    }));
    const store = createTestStore();
    const request = store.dispatch(fetchTickets({}));
    request.abort();
    const result = await request;
    expect(fetchTickets.rejected.match(result) && result.meta.aborted).toBe(true);
    expect(store.getState().tickets.error).toBeNull();
  });

  it("does not allow an older request to overwrite a newer result", async () => {
    server.use(http.get("*/tickets", async ({ request }) => {
      const q = new URL(request.url).searchParams.get("q");
      if (q === "older") await new Promise((resolve) => setTimeout(resolve, 100));
      return HttpResponse.json([{ ...mockTicket, id: q ?? "none", subject: q ?? "none" }], {
        headers: { "x-total-count": "1" },
      });
    }));
    const store = createTestStore();
    const older = store.dispatch(fetchTickets({ search: "older" }));
    const newer = store.dispatch(fetchTickets({ search: "newer" }));
    await Promise.all([older, newer]);
    expect(store.getState().tickets.tickets[0]?.id).toBe("newer");
  });
});
