
import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import apiClient from "./apiClient";

apiClient.defaults.adapter = "http";

afterEach(() => sessionStorage.clear());

afterEach(() => {
  sessionStorage.clear();
});

describe("Axios API client authentication", () => {
  it("attaches the bearer token to API requests when present", async () => {
    let authorization: string | null = null;

    sessionStorage.setItem("token", "sample-access-token");

    server.use(
      http.get(/\/auth-check$/, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    await apiClient.get("/auth-check");

    expect(authorization).toBe("Bearer sample-access-token");
  });

  it("does not attach an authorization header when no token exists", async () => {
    let authorization: string | null = "unexpected";

    server.use(
      http.get(/\/auth-check$/, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    await apiClient.get("/auth-check");

    expect(authorization).toBeNull();
  });
});
