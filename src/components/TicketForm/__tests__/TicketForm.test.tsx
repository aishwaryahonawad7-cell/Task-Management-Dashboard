import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketForm from "../TicketForm";

describe("TicketForm", () => {
  it("renders the create form fields", () => {
    render(<TicketForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^subject$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("shows required field validation and does not submit invalid data", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TicketForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /create ticket/i }));
    expect(await screen.findByText("Customer name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid trimmed ticket details", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TicketForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText(/customer name/i), "  Priya Sharma  ");
    await user.type(screen.getByLabelText(/^email$/i), "priya@example.com");
    await user.type(screen.getByLabelText(/^subject$/i), " Payment issue ");
    await user.type(screen.getByLabelText(/description/i), " Payment failed ");
    await user.click(screen.getByRole("button", { name: /create ticket/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      customerName: "Priya Sharma", email: "priya@example.com", subject: "Payment issue", description: "Payment failed",
    });
  });

  it("calls cancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<TicketForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
