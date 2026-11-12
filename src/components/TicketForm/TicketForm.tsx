
import { useState } from "react";

import type {
  Ticket,
  TicketFormData
} from "../../features/tickets/ticket.types";

interface TicketFormProps {
  initialData?: Ticket;
  onSubmit: (data: TicketFormData) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: TicketFormData = {
  customerName: "",
  email: "",
  subject: "",
  description: "",
  priority: "Medium",
  status: "Open"
};

function TicketForm({
  initialData,
  onSubmit,
  onCancel
}: TicketFormProps) {

  // Initialize form data without useEffect
  const [formData, setFormData] =
    useState<TicketFormData>(() => {
      if (!initialData) {
        return { ...emptyForm };
      }

      return {
        customerName: initialData.customerName,
        email: initialData.email,
        subject: initialData.subject,
        description: initialData.description,
        priority: initialData.priority,
        status: initialData.status
      };
    });

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);

  // FORM VALIDATION
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // HANDLE INPUT CHANGES
  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: ""
    }));
  }

  // HANDLE FORM SUBMISSION
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim()
      });
    } catch {
      setErrors((previous) => ({
        ...previous,
        submit: "Unable to save ticket. Please try again."
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ticket-form">

      <h3>
        {initialData ? "Update Ticket" : "Create Ticket"}
      </h3>

      {errors.submit && (
        <small className="error" role="alert">
          {errors.submit}
        </small>
      )}

      <label htmlFor="customerName">Customer Name</label>
      <input
        id="customerName"
        name="customerName"
        value={formData.customerName}
        onChange={handleChange}
        aria-invalid={Boolean(errors.customerName)}
      />
      {errors.customerName && (
        <small className="error">{errors.customerName}</small>
      )}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        aria-invalid={Boolean(errors.email)}
      />
      {errors.email && (
        <small className="error">{errors.email}</small>
      )}

      <label htmlFor="subject">Subject</label>
      <input
        id="subject"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        aria-invalid={Boolean(errors.subject)}
      />
      {errors.subject && (
        <small className="error">{errors.subject}</small>
      )}

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows={4}
        aria-invalid={Boolean(errors.description)}
      />
      {errors.description && (
        <small className="error">{errors.description}</small>
      )}

      <label htmlFor="priority">Priority</label>
      <select
        id="priority"
        name="priority"
        value={formData.priority}
        onChange={handleChange}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <label htmlFor="status">Status</label>
      <select
        id="status"
        name="status"
        value={formData.status}
        onChange={handleChange}
      >
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
        <option value="Closed">Closed</option>
      </select>

      <div className="form-actions">

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : initialData
              ? "Update Ticket"
              : "Create Ticket"}
        </button>

      </div>
    </form>
  );
}

export default TicketForm;
