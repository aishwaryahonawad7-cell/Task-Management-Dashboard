import type { ReactElement, PropsWithChildren } from "react";

import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { configureStore } from "@reduxjs/toolkit";
import ticketsReducer from "../features/tickets/ticketSlice";

export const createTestStore = () => {
  return configureStore({
    reducer: {
      tickets: ticketsReducer,
    },
  });
};

interface RenderOptions {
  store?: ReturnType<typeof createTestStore>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderOptions = {}
) => {
  const store = options.store ?? createTestStore();

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper }),
  };
};