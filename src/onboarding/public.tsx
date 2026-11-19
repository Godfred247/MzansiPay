import { Link } from "react-router-dom";
import { formatRand } from "../format.ts";
import { EMPLOYER_PLANS, PRACTICE_PLANS } from "../sample.ts";
import { ButtonLink, usePageTitle } from "../ui.tsx";
import { PublicFooter, PublicHeader } from "./frame.tsx";

const sampleLines = [
  ["Gross earnings", "R25,000.00"],
  ["Employee deductions", "R4,350.00"],
  ["Net salary", "R20,650.00"],
  ["Employer contributions", "R1,850.00"],
  ["Employer payroll cost", "R26,850.00"],
];

export function LandingPage() {
  usePageTitle("Payroll built for Southern Africa");
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-6 lg:py-20">
          <div>
            <p className="text-sm text-white/70">Payroll built for Southern Africa</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">Payroll your team can check line by line.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              MzansiPay is a paid payroll workspace for South African employers and the accounting practices that prepare their files. Monthly, weekly and fortnightly runs stay separate.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/signup">Create an employer account</ButtonLink>
              <Link to="/accountants" className="inline-flex h-10 items-center justify-center rounded-lg border border-white/30 px-3.5 text-sm font-medium text-white hover:bg-white/10">
                For accounting practices
              </Link>
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 text-ink shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <p className="text-sm font-semibold">How a payslip is grouped</p>
            <p className="mt-1 text-sm text-muted">Illustrative layout. These figures are not a statutory calculation.</p>
            <dl className="mt-4 divide-y divide-line">
              {sampleLines.map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className={label === "Net salary" || label === "Employer payroll cost" ? "font-medium" : "text-muted"}>{label}</dt>
                  <dd className={`num ${label === "Net salary" || label === "Employer payroll cost" ? "font-semibold text-teal-700" : ""}`}>{amount}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-2 lg:px-6">
          <img src="/brand/payroll-desk.jpg" alt="Two colleagues in a Johannesburg office reviewing a printed payslip beside a payroll chart" className="h-80 w-full rounded-2xl object-cover" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">A month of pay, in the order a reviewer reads it</h2>
            <ol className="mt-6 space-y-4">
              {[
                ["1", "Cutoff", "Hours, leave and once-off amounts stop arriving."],
                ["2", "Review", "Gross, employee deductions and employer contributions stay in separate groups."],
                ["3", "Approve", "The employer approves. A practice can prepare the file, not release it."],
                ["4", "Pay and file", "Payslips open for employees. The EMP201 worksheet is prepared, not submitted."],
              ].map(([step, title, body]) => (
                <li key={step} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-white">{step}</span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="employers" className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Three ways into the product</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            ["Employer", "Register the company, choose a paid plan, and open the first payroll period.", "/signup", "Create an employer account"],
            ["Accounting practice", "Register the practice, add the team, and subscribe before any client file is opened.", "/accountants", "See the practice journey"],
            ["Employee", "Accept an invitation from the employer. The employee sees only their own record.", "/invite", "Preview an invitation"],
          ].map(([title, body, href, action]) => (
            <article key={title} className="flex flex-col rounded-xl border border-line bg-white p-5">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{body}</p>
              <Link to={href} className="mt-4 text-sm font-medium text-blue-700">
                {action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:px-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Employer plans</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Prices include VAT at 15%. There is no free plan. A subscription can be changed or ended at the close of a billing period.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {EMPLOYER_PLANS.map((plan) => (
              <article key={plan.id} className="rounded-xl border border-line p-4">
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                <p className="num mt-2 text-2xl font-semibold text-teal-700">
                  {formatRand(plan.price)}
                  <span className="text-sm font-normal text-muted"> / month</span>
                </p>
                <p className="mt-1 text-sm text-muted">{plan.audience}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Built for sensitive payroll records</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Role-based access", "A payroll administrator, an HR administrator and a reports viewer do not share the same actions."],
            ["Employer approval", "A practice can prepare a run. The employer approves it and releases the payment batch."],
            ["Authorised clients only", "An accountant opens a client file only after that employer has granted access."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-line bg-white p-5">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">PAYE, UIF, SDL, EMP201, EMP501, IRP5 and IT3(a) are part of the payroll vocabulary. MzansiPay does not file with SARS and is not endorsed by SARS.</p>
      </section>
      <PublicFooter />
    </div>
  );
}

export function AccountantLandingPage() {
  usePageTitle("For accounting practices");
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-20">
          <p className="text-sm text-white/70">For accounting practices</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">Prepare client payroll. The employer still approves it.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Harbour-style practices use MzansiPay to keep a payroll calendar, a processing queue and a team. A client file opens only when that employer has authorised the practice.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/accountants/signup">Create a practice account</ButtonLink>
            <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-lg border border-white/30 px-3.5 text-sm font-medium text-white hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3 lg:px-6">
        {[
          ["Payroll calendar", "Monthly, weekly and fortnightly pay dates sit on one practice calendar."],
          ["Client authorisation", "Pending and revoked employers stay out of the workspace."],
          ["Practice team", "Partners, practitioners and reviewers have different responsibilities."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Practice plans</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Prices include VAT at 15%. There is no free practice plan.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {PRACTICE_PLANS.map((plan) => (
              <article key={plan.id} className="rounded-xl border border-line p-5">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="num mt-2 text-2xl font-semibold text-teal-700">
                  {formatRand(plan.price)}
                  <span className="text-sm font-normal text-muted"> / month</span>
                </p>
                <p className="mt-1 text-sm text-muted">{plan.audience}</p>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {plan.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8">
            <ButtonLink to="/accountants/signup">Continue to practice registration</ButtonLink>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
