import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { OrgId } from "../domain.ts";
import { DEMO_DATE_LONG, DEMO_TIME } from "../format.ts";
import { useOnboarding } from "../onboarding/context.tsx";
import { useApp } from "../state.tsx";
import { Button, Field, Input, Mark, usePageTitle } from "../ui.tsx";

const profiles: { name: string; role: string; detail: string; href: string; orgId: OrgId }[] = [
  { name: "Amara Dube", role: "Payroll administrator", detail: "Khanyisa Retail · employer web", href: "/e", orgId: "khanyisa" },
  { name: "Ruan Meyer", role: "Payroll practitioner", detail: "Harbour & Co · practice web", href: "/a", orgId: "khanyisa" },
  { name: "Amara Dube", role: "Employer mobile", detail: "Khanyisa Retail · phone", href: "/m", orgId: "khanyisa" },
  { name: "Thandiwe Nkosi", role: "Employee", detail: "Own payslips and leave only", href: "/me", orgId: "khanyisa" },
];

export function SignIn() {
  usePageTitle("Sign in");
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const { state: onboarding } = useOnboarding();
  const savedSetup = Boolean(onboarding.wizard.savedAt || onboarding.wizard.companyTrading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  function enter(href: string, orgId: OrgId) {
    dispatch({ type: "set-org", orgId });
    navigate(href);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Enter your work email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 8) next.password = "Use at least 8 characters.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({ form: "Password sign-in is not open in this demonstration. Continue with a demonstration profile." });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(255,255,255,0.7) 28px)" }}
        />
        <div className="relative flex items-center gap-3">
          <Mark />
          <div>
            <p className="text-lg font-semibold">MzansiPay</p>
            <p className="text-sm text-white/60">Payroll built for Southern Africa</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight">Payroll that can be checked line by line.</h1>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-white/75">
            <li>Monthly, weekly and fortnightly pay, kept as separate runs.</li>
            <li>Employee deductions never sit in the same total as employer contributions.</li>
            <li>Built for the employer and for the accounting practice that prepares the file.</li>
          </ul>
        </div>
        <p className="relative text-sm text-white/60">
          {DEMO_DATE_LONG} · {DEMO_TIME}. Fictional companies only. Not a SARS service.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark />
            <div>
              <p className="font-semibold text-navy">MzansiPay</p>
              <p className="text-sm text-muted">Payroll built for Southern Africa</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your work email, or open a demonstration profile.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <Field label="Work email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" autoComplete="username" value={email} invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password}>
              <Input id="password" type="password" autoComplete="current-password" value={password} invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            {errors.form ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {errors.form}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link className="font-medium text-blue-700" to="/forgot">Forgot password</Link>
            <Link className="font-medium text-blue-700" to="/signup">Create an employer account</Link>
            <Link className="font-medium text-blue-700" to="/accountants/signup">Register an accounting practice</Link>
            <Link className="font-medium text-blue-700" to="/invite">Preview an employee invitation</Link>
            {savedSetup ? <Link className="font-medium text-blue-700" to="/setup">Continue organisation setup</Link> : null}
          </div>
          <div className="mt-8">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Demonstration profiles</p>
            <div className="mt-3 space-y-2">
              {profiles.map((profile) => (
                <button
                  key={profile.href}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-left hover:border-blue-200"
                  onClick={() => enter(profile.href, profile.orgId)}
                >
                  <span>
                    <span className="block text-sm font-semibold">{profile.name}</span>
                    <span className="block text-sm text-muted">{profile.role}</span>
                  </span>
                  <span className="text-xs text-muted">{profile.detail}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-6 text-sm text-muted">
            <Link className="font-medium text-blue-700" to="/">
              Back to the public site
            </Link>
            <span className="mx-2">·</span>
            <Link className="font-medium text-blue-700" to="/design-system">
              View the design system
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
