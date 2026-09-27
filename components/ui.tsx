/**
 * Reusable UI primitives (AGENTS.md section 35).
 * Presentational only — no data fetching.
 *
 * Colors come from the palette tokens in app/globals.css (AGENTS.md #WARNA):
 * bg-surface cards, border-line borders, text-muted secondary text, and
 * bg-brand / bg-brand-hover for the primary action.
 */

import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary:
    "border border-line bg-surface text-foreground hover:bg-slate-100",
  danger: "bg-danger text-white hover:bg-red-700",
  ghost: "text-foreground hover:bg-slate-100",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${sizeClass} ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const FIELD_CLASS =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-foreground placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50 disabled:text-slate-400";

export function Input(props: React.ComponentProps<"input">) {
  const { className = "", ...rest } = props;
  return <input className={`${FIELD_CLASS} ${className}`} {...rest} />;
}

export function Textarea(props: React.ComponentProps<"textarea">) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-lg border border-line bg-surface p-3 text-sm text-foreground placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 ${className}`}
      {...rest}
    />
  );
}

export function Select(props: React.ComponentProps<"select">) {
  const { className = "", ...rest } = props;
  return <select className={`${FIELD_CLASS} ${className}`} {...rest} />;
}

export function Spinner({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
      </div>
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Shared class for the solid blue primary button/link used on cards and
 * empty states (AGENTS.md #WARNA: Primary #2563EB, hover #1D4ED8).
 */
export const PRIMARY_ACTION_CLASS =
  "inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover";

/**
 * Shared class for the outlined secondary button/link (edit, batal).
 */
export const SECONDARY_ACTION_CLASS =
  "inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-slate-100";
