
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./mocks/server";
import apiClient from "../services/apiClient";

// Use Axios HTTP adapter for Node-based MSW tests.
apiClient.defaults.adapter = "http";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});
