
import { configureStore } from "@reduxjs/toolkit";

import ticketReducer from "../features/tickets/ticketSlice";
import { ticketApi } from "../features/tickets/ticketApi";

export const store = configureStore({
  reducer: {
    // Keep the existing Redux ticket slice for now.
    tickets: ticketReducer,

    // Add the RTK Query reducer.
    [ticketApi.reducerPath]: ticketApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ticketApi.middleware),
});

// Root state type
export type RootState = ReturnType<typeof store.getState>;

// Dispatch type
export type AppDispatch = typeof store.dispatch;
