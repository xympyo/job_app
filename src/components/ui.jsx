import { cloneElement, useEffect, useId, useRef, useState } from "react";
import { X, ArrowUpRight, AlertCircle, Inbox } from "lucide-react";
import { errorMessage } from "../lib/schema";

export function Button({ children, variant = "", className = "", ...props }) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Field({ label, children, hint, className = "" }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Input({ label, hint, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <input {...props} />
    </Field>
  );
}
export function Textarea({ label, hint, ...props }) {
  return (
    <Field label={label} hint={hint}>
      <textarea rows={4} {...props} />
    </Field>
  );
}
export function Select({ label, options, empty, ...props }) {
  return (
    <Field label={label}>
      <select {...props}>
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map((o) => (
          <option
            key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}
          >
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function ErrorBox({ message }) {
  return message ? (
    <div role="alert" className="error-box">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  ) : null;
}
export function Empty({ title, description, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Inbox size={26} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function ExternalLink({ href, children }) {
  if (!/^https?:\/\//i.test(href || "")) return null;
  return (
    <a
      className="external-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export function Modal({ title, onClose, children, wide = false }) {
  const dialog = useRef(null);
  useEffect(() => {
    const d = dialog.current;
    d.showModal();
    return () => {
      d.close();
    };
  }, []);
  return (
    <dialog
      className={`modal ${wide ? "wide" : ""}`}
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={title}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function AsyncForm({ onSubmit, children, className = "" }) {
  const [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setPending(true);
        try {
          await onSubmit();
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setPending(false);
        }
      }}
    >
      <ErrorBox message={error} />
      <fieldset disabled={pending}>{children}</fieldset>
    </form>
  );
}
export function Confirm({ title, description, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <AsyncForm onSubmit={onConfirm}>
        <p className="muted">{description}</p>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit">
            Confirm deletion
          </Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value))
    : "Not specified";
export const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "No date set";
export function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export const toTimestamp = (value) =>
  value ? new Date(value).toISOString() : "";
