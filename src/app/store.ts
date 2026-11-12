
import { configureStore } from "@reduxjs/toolkit";

import ticketReducer from "../features/tickets/ticketSlice";

export const store = configureStore({
  reducer: {
    tickets: ticketReducer,
  },
});

// Root state type
export type RootState = ReturnType<
  typeof store.getState
>;

// Dispatch type
export type AppDispatch = typeof store.dispatch;
