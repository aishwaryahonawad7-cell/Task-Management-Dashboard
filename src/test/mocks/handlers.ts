
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get(/\/tickets$/, () => {
    return HttpResponse.json([], {
      headers: {
        "x-total-count": "0",
      },
    });
  }),
];
