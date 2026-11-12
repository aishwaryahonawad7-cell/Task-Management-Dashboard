
import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import type {
  Ticket,
  TicketFormData,
  TicketQueryParams,
  TicketListResponse,
  TicketStatus,
} from "./ticket.types";

// --------------------------------------------------
// Types for bulk operations
// --------------------------------------------------

export interface BulkOperationResult {
  succeeded: string[];

  failed: {
    ticketId: string;
    error: string;
  }[];
}

export interface BulkStatusUpdateArgs {
  ticketIds: string[];
  status: TicketStatus;
  queryArgs: TicketQueryParams;
}

export interface BulkAssignmentArgs {
  ticketIds: string[];
  agentId: string | null;
}

// --------------------------------------------------
// API configuration
// --------------------------------------------------

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,

  prepareHeaders: (headers) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Accept", "application/json");

    return headers;
  },
});

// --------------------------------------------------
// Ticket API
// --------------------------------------------------

export const ticketApi = createApi({
  reducerPath: "ticketApi",

  baseQuery,

  tagTypes: ["Ticket"],

  endpoints: (builder) => ({

    // ----------------------------------------------
    // Fetch tickets
    // ----------------------------------------------

    getTickets: builder.query<
      TicketListResponse,
      TicketQueryParams
    >({
      query: (params) => ({
        url: "/tickets",
        params: {
          _page: params.page ?? 1,
          _limit: params.limit ?? 5,
          q: params.search || undefined,
          status: params.status || undefined,
          priority: params.priority || undefined,
          assignedTo: params.assignedTo || undefined,
          _sort: params.sortBy || undefined,
          _order: params.order || undefined,
        },
      }),

      transformResponse: (
        response: Ticket[],
        meta
      ): TicketListResponse => ({
        data: response,
        total: Number(
          meta?.response?.headers.get("x-total-count") ??
            response.length
        ),
      }),

      providesTags: (result) =>
        result
          ? [
              ...result.data.map((ticket) => ({
                type: "Ticket" as const,
                id: ticket.id,
              })),
              { type: "Ticket" as const, id: "LIST" },
            ]
          : [
              { type: "Ticket" as const, id: "LIST" },
            ],
    }),

    // ----------------------------------------------
    // Fetch one ticket
    // ----------------------------------------------

    getTicketById: builder.query<Ticket, string>({
      query: (id) => `/tickets/${id}`,

      providesTags: (_result, _error, id) => [
        { type: "Ticket", id },
      ],
    }),

    // ----------------------------------------------
    // Create ticket
    // ----------------------------------------------

    createTicket: builder.mutation<
      Ticket,
      TicketFormData
    >({
      query: (data) => ({
        url: "/tickets",
        method: "POST",
        body: {
          id: `TKT-${Date.now()}`,
          customerName: data.customerName.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          description: data.description.trim(),
          priority: data.priority,
          status: data.status,
          assignedTo: data.assignedTo ?? null,
          createdAt: new Date().toISOString(),
        },
      }),

      invalidatesTags: [
        { type: "Ticket", id: "LIST" },
      ],
    }),

    // ----------------------------------------------
    // Update individual ticket
    // ----------------------------------------------

    updateTicket: builder.mutation<
      Ticket,
      {
        id: string;
        data: Partial<TicketFormData>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/tickets/${id}`,
        method: "PATCH",
        body: data,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    // ----------------------------------------------
    // Assign individual ticket
    // ----------------------------------------------

    assignTicket: builder.mutation<
      Ticket,
      {
        ticketId: string;
        agentId: string | null;
      }
    >({
      query: ({ ticketId, agentId }) => ({
        url: `/tickets/${ticketId}`,
        method: "PATCH",
        body: {
          assignedTo: agentId,
        },
      }),

      invalidatesTags: (
        _result,
        _error,
        { ticketId }
      ) => [
        { type: "Ticket", id: ticketId },
        { type: "Ticket", id: "LIST" },
      ],
    }),

    // ----------------------------------------------
    // Bulk update ticket status
    // ----------------------------------------------

    bulkUpdateTicketStatus: builder.mutation<
      BulkOperationResult,
      BulkStatusUpdateArgs
    >({
      async queryFn(
        { ticketIds, status },
        _api,
        _extraOptions,
        baseQuery
      ) {
        const uniqueIds = [...new Set(ticketIds)];

        const results = await Promise.all(
          uniqueIds.map(async (ticketId) => {
            const result = await baseQuery({
              url: `/tickets/${ticketId}`,
              method: "PATCH",
              body: { status },
            });

            if (result.error) {
              return {
                ticketId,
                error: JSON.stringify(result.error),
              };
            }

            return {
              ticketId,
              error: null,
            };
          })
        );

        const succeeded = results
          .filter((result) => result.error === null)
          .map((result) => result.ticketId);

        const failed = results
          .filter(
            (
              result
            ): result is {
              ticketId: string;
              error: string;
            } => result.error !== null
          )
          .map((result) => ({
            ticketId: result.ticketId,
            error: result.error,
          }));

        return {
          data: {
            succeeded,
            failed,
          },
        };
      },

      // Optimistically update the requested query cache.
      async onQueryStarted(
        { ticketIds, status, queryArgs },
        { dispatch, queryFulfilled }
      ) {
        const uniqueIds = new Set(ticketIds);

        const patchResult = dispatch(
          ticketApi.util.updateQueryData(
            "getTickets",
            queryArgs,
            (draft) => {
              draft.data.forEach((ticket) => {
                if (uniqueIds.has(ticket.id)) {
                  ticket.status = status;
                }
              });
            }
          )
        );

        try {
          const { data } = await queryFulfilled;

          // If any ticket failed, restore the previous cache.
          // The invalidation below will fetch the actual server state.
          if (data.failed.length > 0) {
            patchResult.undo();
          }
        } catch {
          // Network or unexpected mutation failure.
          patchResult.undo();
        }
      },

      // Refresh ticket lists after the operation.
      invalidatesTags: [
        { type: "Ticket", id: "LIST" },
      ],
    }),

    // ----------------------------------------------
    // Bulk assign tickets
    // ----------------------------------------------

    bulkAssignTickets: builder.mutation<
      BulkOperationResult,
      BulkAssignmentArgs
    >({
      async queryFn(
        { ticketIds, agentId },
        _api,
        _extraOptions,
        baseQuery
      ) {
        const uniqueIds = [...new Set(ticketIds)];

        const results = await Promise.all(
          uniqueIds.map(async (ticketId) => {
            const result = await baseQuery({
              url: `/tickets/${ticketId}`,
              method: "PATCH",
              body: {
                assignedTo: agentId,
              },
            });

            if (result.error) {
              return {
                ticketId,
                error: JSON.stringify(result.error),
              };
            }

            return {
              ticketId,
              error: null,
            };
          })
        );

        const succeeded = results
          .filter((result) => result.error === null)
          .map((result) => result.ticketId);

        const failed = results
          .filter(
            (
              result
            ): result is {
              ticketId: string;
              error: string;
            } => result.error !== null
          )
          .map((result) => ({
            ticketId: result.ticketId,
            error: result.error,
          }));

        return {
          data: {
            succeeded,
            failed,
          },
        };
      },

      invalidatesTags: [
        { type: "Ticket", id: "LIST" },
      ],
    }),

    // ----------------------------------------------
    // Delete ticket
    // ----------------------------------------------

    deleteTicket: builder.mutation<string, string>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: "DELETE",
      }),

      transformResponse: (
        _response: unknown,
        _meta,
        id
      ) => id,

      invalidatesTags: (_result, _error, id) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
      ],
    }),
  }),
});

// --------------------------------------------------
// Export generated hooks
// --------------------------------------------------

export const {
  useGetTicketsQuery,
  useGetTicketByIdQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAssignTicketMutation,
  useDeleteTicketMutation,
  useBulkUpdateTicketStatusMutation,
  useBulkAssignTicketsMutation,
} = ticketApi;
