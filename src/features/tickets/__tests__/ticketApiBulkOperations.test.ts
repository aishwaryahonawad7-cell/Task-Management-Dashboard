
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../test/mocks/server";
import { ticketApi } from "../ticketApi";
import { mockTicket } from "./ticketFixtures";

const createApiTestStore = () =>
  configureStore({
    reducer: {
      [ticketApi.reducerPath]: ticketApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(ticketApi.middleware),
  });

afterEach(() => {
  server.resetHandlers();
});

describe("RTK Query bulk ticket operations", () => {
  it("bulk updates the status of all selected tickets", async () => {
    const patchedTickets: string[] = [];

    server.use(
      http.patch("*/tickets/:id", async ({ params, request }) => {
        const id = String(params.id);
        const body = await request.json() as {
          status: string;
        };

        patchedTickets.push(id);

        return HttpResponse.json({
          ...mockTicket,
          id,
          status: body.status,
        });
      })
    );

    const store = createApiTestStore();

    const result = await store.dispatch(
      ticketApi.endpoints.bulkUpdateTicketStatus.initiate({
        ticketIds: ["TKT-001", "TKT-002"],
        status: "Resolved",
        queryArgs: {
          page: 1,
          limit: 5,
        },
      })
    ).unwrap();

    expect(result.succeeded).toHaveLength(2);
    expect(result.succeeded).toContain("TKT-001");
    expect(result.succeeded).toContain("TKT-002");
    expect(result.failed).toHaveLength(0);
    expect(patchedTickets).toHaveLength(2);
  });

  it("does not update duplicate ticket IDs more than once", async () => {
    const patchedTickets: string[] = [];

    server.use(
      http.patch("*/tickets/:id", ({ params }) => {
        patchedTickets.push(String(params.id));

        return HttpResponse.json(mockTicket);
      })
    );

    const store = createApiTestStore();

    const result = await store.dispatch(
      ticketApi.endpoints.bulkUpdateTicketStatus.initiate({
        ticketIds: [
          "TKT-001",
          "TKT-001",
          "TKT-002",
        ],
        status: "In Progress",
        queryArgs: {
          page: 1,
          limit: 5,
        },
      })
    ).unwrap();

    expect(result.succeeded).toHaveLength(2);
    expect(patchedTickets).toHaveLength(2);
    expect(new Set(patchedTickets).size).toBe(2);
  });

  it("bulk assigns all selected tickets to an agent", async () => {
    const patchedBodies: unknown[] = [];

    server.use(
      http.patch("*/tickets/:id", async ({ request }) => {
        const body = await request.json();

        patchedBodies.push(body);

        return HttpResponse.json({
          ...mockTicket,
          assignedTo: "3",
        });
      })
    );

    const store = createApiTestStore();

    const result = await store.dispatch(
      ticketApi.endpoints.bulkAssignTickets.initiate({
        ticketIds: ["TKT-001", "TKT-002"],
        agentId: "3",
      })
    ).unwrap();

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(0);

    expect(patchedBodies).toHaveLength(2);

    patchedBodies.forEach((body) => {
      expect(body).toEqual({
        assignedTo: "3",
      });
    });
  });

  it("supports bulk unassignment by setting assignedTo to null", async () => {
    let receivedBody: unknown;

    server.use(
      http.patch("*/tickets/:id", async ({ request }) => {
        receivedBody = await request.json();

        return HttpResponse.json({
          ...mockTicket,
          assignedTo: null,
        });
      })
    );

    const store = createApiTestStore();

    const result = await store.dispatch(
      ticketApi.endpoints.bulkAssignTickets.initiate({
        ticketIds: ["TKT-001"],
        agentId: null,
      })
    ).unwrap();

    expect(result.succeeded).toEqual(["TKT-001"]);
    expect(result.failed).toHaveLength(0);
    expect(receivedBody).toEqual({
      assignedTo: null,
    });
  });

  it("reports successful and failed tickets separately", async () => {
    server.use(
      http.patch("*/tickets/:id", ({ params }) => {
        const id = String(params.id);

        if (id === "TKT-002") {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        }

        return HttpResponse.json({
          ...mockTicket,
          id,
          status: "Closed",
        });
      })
    );

    const store = createApiTestStore();

    const result = await store.dispatch(
      ticketApi.endpoints.bulkUpdateTicketStatus.initiate({
        ticketIds: [
          "TKT-001",
          "TKT-002",
          "TKT-003",
        ],
        status: "Closed",
        queryArgs: {
          page: 1,
          limit: 5,
        },
      })
    ).unwrap();

    expect(result.succeeded).toContain("TKT-001");
    expect(result.succeeded).toContain("TKT-003");

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].ticketId).toBe("TKT-002");
    expect(result.failed[0].error).toBeTruthy();
  });

  it("reports network failures without losing the other results", async () => {
    server.use(
      http.patch("*/tickets/:id", ({ params }) => {
        const id = String(params.id);

        if (id === "TKT-002") {
          return HttpResponse.error();
        }

        return HttpResponse.json({
          ...mockTicket,
          id,
          assignedTo: "3",
        });
      })
    );

    const store = createApiTestStore();

    const result = await store.dispatch(
      ticketApi.endpoints.bulkAssignTickets.initiate({
        ticketIds: [
          "TKT-001",
          "TKT-002",
        ],
        agentId: "3",
      })
    ).unwrap();

    expect(result.succeeded).toContain("TKT-001");
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].ticketId).toBe("TKT-002");
  });
});
