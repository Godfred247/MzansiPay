import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Plan } from "../domain.ts";
import { formatRand } from "../format.ts";
import { Button, ButtonLink, Mark, cn, usePageTitle } from "../ui.tsx";
import type { StepLink } from "./model.ts";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/#employers", label: "Employers" },
    { href: "/accountants", label: "Accountants" },
    { href: "/invite", label: "Employee invitation" },
    { href: "/setup", label: "Organisation setup" },
  ];
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight text-navy">MzansiPay</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-ink lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} to={link.href} className="hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink to="/login" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink to="/signup">Start</ButtonLink>
        </div>
        <button type="button" className="h-10 rounded-lg border border-line px-3 text-sm font-medium lg:hidden" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div className="space-y-1 border-t border-line px-4 py-3 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} to={link.href} className="block rounded-lg px-2 py-2 text-sm" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <ButtonLink to="/login" variant="secondary" className="flex-1">
              Sign in
            </ButtonLink>
            <ButtonLink to="/signup" className="flex-1">
              Start
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted lg:px-6">
        <p>MzansiPay demonstration. Fictional companies only. Not a SARS service.</p>
        <div className="flex gap-4">
          <Link to="/login" className="hover:text-ink">
            Sign in
          </Link>
          <Link to="/design-system" className="hover:text-ink">
            Design system
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AuthLayout({
  title,
  lede,
  aside,
  children,
  footer,
}: {
  title: string;
  lede: string;
  aside: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  usePageTitle(title);
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(255,255,255,0.7) 28px)" }} />
        <Link to="/" className="relative flex items-center gap-3">
          <Mark />
          <span>
            <span className="block text-lg font-semibold">MzansiPay</span>
            <span className="block text-sm text-white/60">Payroll built for Southern Africa</span>
          </span>
        </Link>
        <p className="relative max-w-md text-3xl font-semibold tracking-tight">{aside}</p>
        <p className="relative text-sm text-white/60">Fictional companies only. Not a SARS service.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark />
            <span>
              <span className="block font-semibold text-navy">MzansiPay</span>
              <span className="block text-sm text-muted">Payroll built for Southern Africa</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-muted">{lede}</p>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}

export function StepRail({ steps, current, done }: { steps: StepLink[]; current: string; done: string[] }) {
  return (
    <nav aria-label="Progress" className="rounded-xl border border-line bg-white p-3">
      <ol className="space-y-1">
        {steps.map((step, index) => {
          const complete = done.includes(step.id);
          const active = step.id === current;
          return (
            <li key={step.id}>
              <Link
                to={step.href}
                aria-current={active ? "step" : undefined}
                className={cn("flex items-center gap-3 rounded-lg px-2 py-2 text-sm", active ? "bg-blue-50 text-blue-800" : "text-ink hover:bg-slate-50")}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    complete ? "bg-teal-700 text-white" : active ? "bg-blue-600 text-white" : "bg-slate-100 text-muted",
                  )}
                >
                  {complete ? "✓" : index + 1}
                </span>
                <span className={active ? "font-semibold" : undefined}>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MobileProgress({ steps, current }: { steps: StepLink[]; current: string }) {
  const index = Math.max(0, steps.findIndex((step) => step.id === current));
  const step = steps[index];
  return (
    <div className="mb-4 lg:hidden">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium">
          Step {index + 1} of {steps.length}
        </p>
        <p className="text-muted">{step?.label}</p>
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-200" aria-hidden="true">
        <div className="h-1 rounded-full bg-blue-600" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

export function JourneyFrame({
  steps,
  current,
  done,
  title,
  description,
  children,
  backTo,
  onSave,
  onSubmit,
  submitLabel = "Continue",
  busy,
}: {
  steps: StepLink[];
  current: string;
  done: string[];
  title: string;
  description: string;
  children: ReactNode;
  backTo?: string;
  onSave?: () => void;
  onSubmit?: (event: FormEvent) => void;
  submitLabel?: string;
  busy?: boolean;
}) {
  usePageTitle(title);
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark />
            <span className="font-semibold text-navy">MzansiPay</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-blue-700">
            Sign in
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <StepRail steps={steps} current={current} done={done} />
          </div>
        </div>
        <form
          noValidate
          className="min-w-0"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.(event);
          }}
        >
          <MobileProgress steps={steps} current={current} />
          <section className="rounded-xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] sm:p-6">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p>
            <div className="mt-6 space-y-4">{children}</div>
          </section>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {backTo ? (
              <ButtonLink to={backTo} variant="secondary">
                Back
              </ButtonLink>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-2">
              {onSave ? (
                <Button type="button" variant="secondary" onClick={onSave}>
                  Save and finish later
                </Button>
              ) : null}
              {onSubmit ? (
                <Button type="submit" disabled={busy}>
                  {busy ? "Please wait…" : submitLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
      {message}
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm leading-6 text-muted">{children}</div>;
}

export function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function ChoiceCard({
  name,
  checked,
  title,
  body,
  onChange,
}: {
  name: string;
  checked: boolean;
  title: string;
  body: string;
  onChange: () => void;
}) {
  return (
    <label className={cn("block cursor-pointer rounded-xl border p-4", checked ? "border-blue-600 bg-blue-50/50" : "border-line hover:border-blue-200")}>
      <input className="sr-only" type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-sm leading-6 text-muted">{body}</span>
    </label>
  );
}

export function PlanPicker({ plans, value, onChange, columns = "lg:grid-cols-3" }: { plans: Plan[]; value: string; onChange: (id: string) => void; columns?: string }) {
  return (
    <div className={cn("grid gap-3", columns)}>
      {plans.map((plan) => {
        const selected = value === plan.id;
        return (
          <label key={plan.id} className={cn("block cursor-pointer rounded-xl border p-4", selected ? "border-blue-600 ring-1 ring-blue-600" : "border-line")}>
            <input className="sr-only" type="radio" name="plan" checked={selected} onChange={() => onChange(plan.id)} />
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{plan.name}</span>
              {selected ? <span className="text-xs font-medium text-teal-700">Selected</span> : null}
            </span>
            <span className="num mt-1 block text-2xl font-semibold text-teal-700">
              {formatRand(plan.price)}
              <span className="text-sm font-normal text-muted"> / month</span>
            </span>
            <span className="mt-1 block text-sm text-muted">{plan.audience}</span>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {plan.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </label>
        );
      })}
    </div>
  );
}

export function CheckLine({ checked, onChange, label, id }: { checked: boolean; onChange: (value: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm leading-6">
      <input id={id} type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
