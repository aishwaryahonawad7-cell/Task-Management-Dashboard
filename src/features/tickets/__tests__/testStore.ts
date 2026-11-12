import { configureStore } from "@reduxjs/toolkit";

import ticketReducer from "../ticketSlice";

export const createTestStore = () => {
  return configureStore({
    reducer: {
      tickets: ticketReducer,
    },
  });
};

export type TestStore = ReturnType<typeof createTestStore>;