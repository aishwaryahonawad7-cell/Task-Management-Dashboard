
import { describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import Pagination from "../Pagination";

describe("Pagination", () => {
  it("does not render when there is only one page", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when there are zero pages", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={0}
        onPageChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("disables previous on first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /previous/i })
    ).toBeDisabled();
  });

  it("moves to next page from the first page", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^next$/i })
    );

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("moves to previous page from page two", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /previous/i })
    );

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("moves to next page from page two", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^next$/i })
    );

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables next on the last page", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /^next$/i })
    ).toBeDisabled();
  });

  it("moves to a selected page", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "2" })
    );

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("marks the current page as active", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const currentPageButton = screen.getByRole("button", {
      name: "2",
    });

    expect(currentPageButton).toHaveClass("active-page");
    expect(currentPageButton).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("allows selecting the currently active page", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "2" })
    );

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  // Additional defensive branch tests

  it("does not change page when previous is clicked below page one", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={0}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /previous/i })
    );

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not change page when next is clicked beyond the last page", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={4}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^next$/i })
    );

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
