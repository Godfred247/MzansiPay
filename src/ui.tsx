import { useEffect, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { BadgeTone } from "./domain.ts";
import { useApp } from "./state.tsx";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · MzansiPay`;
  }, [title]);
}

const buttonStyles = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-line bg-white text-ink hover:bg-slate-50",
  ghost: "text-ink hover:bg-slate-100",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

const buttonSizes = {
  sm: "h-8 px-2.5 text-sm",
  md: "h-10 px-3.5 text-sm",
};

export function buttonClass(variant: keyof typeof buttonStyles = "primary", size: keyof typeof buttonSizes = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    buttonStyles[variant],
    buttonSizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles; size?: keyof typeof buttonSizes }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  to: string;
  variant?: keyof typeof buttonStyles;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

const badgeStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-50 text-blue-800",
  success: "bg-green-50 text-green-800",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-800",
  teal: "bg-teal-50 text-teal-800",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", badgeStyles[tone])}>{children}</span>;
}

export function Card({ children, className, padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(20,33,61,0.04)]", padding && "p-5", className)}>
      {children}
    </section>
  );
}

export function CardTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  usePageTitle(title);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-sm text-muted">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const controlClass =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-50";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-1.5 text-xs font-medium text-red-700">Required</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(controlClass, invalid && "border-red-500 focus:border-red-600 focus:ring-red-600/20", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({ invalid, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select className={cn(controlClass, invalid && "border-red-500", className)} aria-invalid={invalid || undefined} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(controlClass, "h-auto py-2", invalid && "border-red-500", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  width = "max-w-lg",
  align = "center",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
  align?: "center" | "bottom";
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="no-print fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Close dialog" onClick={onClose} />
      <div className={cn("relative flex min-h-full justify-center p-4", align === "bottom" ? "items-end sm:items-center" : "items-center")}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn("w-full rounded-xl border border-line bg-white shadow-xl", align === "bottom" && "rounded-b-none sm:rounded-xl", width)}
        >
          <div className="border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
          </div>
          {children ? <div className="px-5 py-4">{children}</div> : null}
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = "primary",
  requireCheck,
  checkLabel,
  onConfirm,
  onClose,
  align = "center",
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  requireCheck?: boolean;
  checkLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  align?: "center" | "bottom";
}) {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);
  return (
    <Dialog
      open={open}
      title={title}
      align={align}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} disabled={requireCheck ? !checked : false} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-6 text-ink">{body}</div>
      {requireCheck && checkLabel ? (
        <label className="mt-4 flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className="mt-1" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>{checkLabel}</span>
        </label>
      ) : null}
    </Dialog>
  );
}

export function Toasts() {
  const { state, dispatch } = useApp();
  if (state.toasts.length === 0) return null;
  return (
    <div className="no-print pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2" aria-live="polite">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-lg",
            toast.tone === "error" && "border-red-200 bg-red-50 text-red-900",
            toast.tone === "info" && "border-blue-200 bg-blue-50 text-blue-950",
            toast.tone === "success" && "border-green-200 bg-white text-ink",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button type="button" className="text-muted" onClick={() => dispatch({ type: "dismiss-toast", id: toast.id })} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action, icon }: { title: string; body: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10">
      {icon ? <div className="mb-3 text-navy">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-lg text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-5">
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="mt-1 max-w-xl text-sm leading-6 text-red-800">{body}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
            value === tab.id ? "border-blue-600 text-ink" : "border-transparent text-muted hover:text-ink",
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DefinitionList({ items }: { items: { term: string; detail: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{item.term}</dt>
          <dd className="mt-1 text-sm text-ink">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  getId,
  loading,
  empty,
  pageSize = 6,
  selectable,
  bulkLabel,
  onBulk,
  resetKey = "",
}: {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  loading?: boolean;
  empty: ReactNode;
  pageSize?: number;
  selectable?: boolean;
  bulkLabel?: string;
  onBulk?: (ids: string[]) => void;
  resetKey?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setPage(0);
    setSelected([]);
  }, [resetKey]);

  const sorted = [...rows];
  if (sort) {
    const column = columns.find((item) => item.key === sort.key);
    if (column?.sortValue) {
      sorted.sort((a, b) => {
        const av = column.sortValue!(a);
        const bv = column.sortValue!(b);
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "en");
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
  }
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.includes(getId(row)));

  return (
    <div>
      {selectable && selected.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm">
          <span>{selected.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected([])}>
              Clear
            </Button>
            {onBulk ? (
              <Button size="sm" onClick={() => onBulk(selected)}>
                {bulkLabel ?? "Apply"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              {selectable ? (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      const ids = visible.map(getId);
                      setSelected((current) =>
                        event.target.checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
                      );
                    }}
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <th key={column.key} className={cn("px-3 py-3 font-medium", column.align === "right" && "text-right")} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                    {column.sortValue ? (
                      <button
                        type="button"
                        className={cn("inline-flex items-center gap-1", column.align === "right" && "ml-auto")}
                        onClick={() =>
                          setSort((current) =>
                            current?.key === column.key ? { key: column.key, dir: current.dir === "asc" ? "desc" : "asc" } : { key: column.key, dir: "asc" },
                          )
                        }
                      >
                        {column.header}
                        <span aria-hidden="true">{active ? (sort.dir === "asc" ? "↑" : "↓") : ""}</span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-4">
                  <LoadingBlock />
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-4">
                  {empty}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const id = getId(row);
                return (
                  <tr key={id} className="border-t border-line align-top">
                    {selectable ? (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${id}`}
                          checked={selected.includes(id)}
                          onChange={(event) =>
                            setSelected((current) => (event.target.checked ? [...current, id] : current.filter((item) => item !== id)))
                          }
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td key={column.key} className={cn("px-3 py-3", column.align === "right" && "text-right")}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize ? (
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            Showing {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path d="M8 10.5h16M8 16h12M8 21.5h8" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="23" cy="21.5" r="2.2" fill="#0D9488" />
    </svg>
  );
}

export function Wordmark({ tone = "light", compact = false }: { tone?: "light" | "dark"; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      {compact ? null : (
        <span className="leading-tight">
          <span className={cn("block text-[15px] font-semibold tracking-tight", tone === "light" ? "text-white" : "text-navy")}>MzansiPay</span>
          <span className={cn("block text-[11px]", tone === "light" ? "text-white/60" : "text-muted")}>Southern Africa</span>
        </span>
      )}
    </span>
  );
}
