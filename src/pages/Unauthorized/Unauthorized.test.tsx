
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Unauthorized from "./Unauthorized";

describe("Unauthorized page", () => {
  it("displays the access denied message", () => {
    render(
      <MemoryRouter>
        <Unauthorized />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "403 - Access Denied",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You do not have permission to access this page."
      )
    ).toBeInTheDocument();
  });

  it("provides a link to the dashboard", () => {
    render(
      <MemoryRouter>
        <Unauthorized />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", {
      name: "Go to Dashboard",
    });

    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
