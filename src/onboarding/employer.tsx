import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Plan } from "../domain.ts";
import { formatDateShort, formatRand } from "../format.ts";
import { EMPLOYER_PLANS } from "../sample.ts";
import { Button, ButtonLink, Field, Input, Select } from "../ui.tsx";
import { CheckoutSummary, cardErrors, emptyCard, type CardDraft } from "./checkout.tsx";
import { useOnboarding } from "./context.tsx";
import { ChoiceCard, FormAlert, FormSuccess, JourneyFrame, Note, PlanPicker } from "./frame.tsx";
import { EMPLOYER_STEPS, INDUSTRIES, PROVINCES, SAMPLE_PAYE, SAMPLE_SDL, SAMPLE_UIF, SAMPLE_VAT, frequencyLabel, lethaboEmployer, type EmployerDraft, type Frequency } from "./model.ts";
import {
  employerAddressErrors,
  employerCompanyErrors,
  employerFrequencyErrors,
  employerOrganisationErrors,
  employerPeriodErrors,
  employerRegistrationErrors,
  employerStatutoryErrors,
} from "./validate.ts";

function useEmployerStep(stepId: string) {
  const navigate = useNavigate();
  const api = useOnboarding();
  function complete(href: string) {
    api.markDone("employer", stepId);
    navigate(href);
  }
  return { ...api, complete, draft: api.state.employer, done: api.state.done.employer };
}

function Shell({
  stepId,
  title,
  description,
  backTo,
  submitLabel,
  busy,
  onSubmit,
  children,
}: {
  stepId: string;
  title: string;
  description: string;
  backTo?: string;
  submitLabel?: string;
  busy?: boolean;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  const { done } = useEmployerStep(stepId);
  return (
    <JourneyFrame steps={EMPLOYER_STEPS} current={stepId} done={done} title={title} description={description} backTo={backTo} onSubmit={onSubmit} submitLabel={submitLabel} busy={busy}>
      {children}
    </JourneyFrame>
  );
}

function setText(patch: (partial: Partial<EmployerDraft>) => void, key: keyof EmployerDraft) {
  return (event: { target: { value: string } }) => patch({ [key]: event.target.value } as Partial<EmployerDraft>);
}

export function EmployerOrganisationPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("organisation");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerOrganisationErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/company");
  }

  return (
    <Shell stepId="organisation" title="Create the employer organisation" description="Employees and payslips use the trading name. Statutory worksheets use the registered company name." onSubmit={onSubmit}>
      <Note>Use the Lethabo Foods sample, or type another fictional company. Do not enter a real employer’s records.</Note>
      <Button type="button" variant="secondary" onClick={() => patchEmployer(lethaboEmployer())}>
        Use the Lethabo Foods sample
      </Button>
      <Field label="Trading name" htmlFor="trading-name" required error={errors.tradingName} hint="The name staff will see on payslips.">
        <Input id="trading-name" value={draft.tradingName} invalid={Boolean(errors.tradingName)} onChange={setText(patchEmployer, "tradingName")} />
      </Field>
      <Field label="Registered company name" htmlFor="legal-name" required error={errors.legalName} hint="Include the company suffix, such as (Pty) Ltd.">
        <Input id="legal-name" value={draft.legalName} invalid={Boolean(errors.legalName)} onChange={setText(patchEmployer, "legalName")} />
      </Field>
      {Object.keys(errors).length ? <FormAlert message="Check the highlighted fields." /> : null}
    </Shell>
  );
}

export function EmployerCompanyPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("company");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerCompanyErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/registration");
  }

  return (
    <Shell stepId="company" title="Company information" description="This describes the organisation and your role. It does not create employee records." backTo="/start/employer/organisation" onSubmit={onSubmit}>
      <Field label="Industry" htmlFor="industry" required error={errors.industry}>
        <Select id="industry" value={draft.industry} invalid={Boolean(errors.industry)} onChange={setText(patchEmployer, "industry")}>
          <option value="">Choose an industry</option>
          {INDUSTRIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field label="Employees you expect to pay" htmlFor="band" required error={errors.employeeBand} hint="The band is a guide for the plan. It does not limit the sample.">
        <Select id="band" value={draft.employeeBand} invalid={Boolean(errors.employeeBand)} onChange={setText(patchEmployer, "employeeBand")}>
          <option value="">Choose a band</option>
          <option>1–15</option>
          <option>16–80</option>
          <option>81–250</option>
          <option>More than 250</option>
        </Select>
      </Field>
      <fieldset>
        <legend className="text-sm font-medium">Your role <span className="font-medium text-red-700">Required</span></legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {["Owner", "Payroll administrator", "HR administrator", "Finance manager"].map((role) => (
            <ChoiceCard key={role} name="role" checked={draft.role === role} title={role} body={role === "Owner" ? "Can approve payroll and manage billing." : "Access follows the role once the organisation is open."} onChange={() => patchEmployer({ role })} />
          ))}
        </div>
        {errors.role ? <p className="mt-2 text-sm text-red-700">{errors.role}</p> : null}
      </fieldset>
    </Shell>
  );
}

export function EmployerRegistrationPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("registration");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerRegistrationErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/statutory");
  }

  return (
    <Shell stepId="registration" title="Company registration details" description="The registration number is stored for display. It is not checked against CIPC, and VAT is not verified." backTo="/start/employer/company" onSubmit={onSubmit}>
      <Field label="Company registration number" htmlFor="reg-no" required error={errors.registrationNumber} hint="Fictional sample: 2021/441902/07.">
        <Input id="reg-no" value={draft.registrationNumber} invalid={Boolean(errors.registrationNumber)} onChange={setText(patchEmployer, "registrationNumber")} />
      </Field>
      <fieldset>
        <legend className="text-sm font-medium">VAT registration <span className="text-red-700">Required</span></legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ChoiceCard name="vat" checked={draft.vatChoice === "registered"} title="Registered for VAT" body="Enter the sample reference VAT-SAMPLE. A real VAT number is not accepted." onChange={() => patchEmployer({ vatChoice: "registered" })} />
          <ChoiceCard name="vat" checked={draft.vatChoice === "not-registered"} title="Not registered for VAT" body="Leave the VAT reference blank. You can change this in organisation setup." onChange={() => patchEmployer({ vatChoice: "not-registered", vatReference: "" })} />
        </div>
        {errors.vatChoice ? <p className="mt-2 text-sm text-red-700">{errors.vatChoice}</p> : null}
      </fieldset>
      {draft.vatChoice === "registered" ? (
        <Field label="VAT reference" htmlFor="vat-ref" required error={errors.vatReference} hint={`Type ${SAMPLE_VAT}.`}>
          <Input id="vat-ref" value={draft.vatReference} invalid={Boolean(errors.vatReference)} onChange={setText(patchEmployer, "vatReference")} />
        </Field>
      ) : null}
    </Shell>
  );
}

export function EmployerStatutoryPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("statutory");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerStatutoryErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/address");
  }

  return (
    <Shell stepId="statutory" title="PAYE, UIF and SDL" description="These references identify the employer on statutory worksheets. MzansiPay does not submit them to SARS or the Department of Employment and Labour." backTo="/start/employer/registration" onSubmit={onSubmit}>
      <Note>
        Type the sample tokens {SAMPLE_PAYE}, {SAMPLE_UIF} and {SAMPLE_SDL}. Real tax and labour references are not accepted in this demonstration.
      </Note>
      <Field label="PAYE reference" htmlFor="paye" required error={errors.payeReference} hint="Pay-as-you-earn. The reference is stored. No tax is calculated on this page.">
        <Input id="paye" value={draft.payeReference} invalid={Boolean(errors.payeReference)} onChange={setText(patchEmployer, "payeReference")} />
      </Field>
      <Field label="UIF reference" htmlFor="uif" required error={errors.uifReference} hint="Unemployment Insurance Fund. Employee and employer UIF stay in separate payroll groups later.">
        <Input id="uif" value={draft.uifReference} invalid={Boolean(errors.uifReference)} onChange={setText(patchEmployer, "uifReference")} />
      </Field>
      <fieldset>
        <legend className="text-sm font-medium">Skills Development Levy <span className="text-red-700">Required</span></legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ChoiceCard name="sdl" checked={draft.sdlChoice === "registered"} title="Registered for SDL" body="SDL will appear as an employer contribution, never as an employee deduction." onChange={() => patchEmployer({ sdlChoice: "registered" })} />
          <ChoiceCard name="sdl" checked={draft.sdlChoice === "not-registered"} title="Not registered for SDL" body="SDL lines stay off the payroll until you change this." onChange={() => patchEmployer({ sdlChoice: "not-registered", sdlReference: "" })} />
        </div>
        {errors.sdlChoice ? <p className="mt-2 text-sm text-red-700">{errors.sdlChoice}</p> : null}
      </fieldset>
      {draft.sdlChoice === "registered" ? (
        <Field label="SDL reference" htmlFor="sdl" required error={errors.sdlReference} hint={`Type ${SAMPLE_SDL}.`}>
          <Input id="sdl" value={draft.sdlReference} invalid={Boolean(errors.sdlReference)} onChange={setText(patchEmployer, "sdlReference")} />
        </Field>
      ) : null}
    </Shell>
  );
}

export function EmployerAddressPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("address");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerAddressErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/frequencies");
  }

  return (
    <Shell stepId="address" title="Address and contact details" description="This is the organisation’s payroll contact. It is not an employee’s home address." backTo="/start/employer/statutory" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Street address" htmlFor="street" required error={errors.street}>
          <Input id="street" value={draft.street} invalid={Boolean(errors.street)} onChange={setText(patchEmployer, "street")} />
        </Field>
        <Field label="Suburb" htmlFor="suburb" required error={errors.suburb}>
          <Input id="suburb" value={draft.suburb} invalid={Boolean(errors.suburb)} onChange={setText(patchEmployer, "suburb")} />
        </Field>
        <Field label="City" htmlFor="city" required error={errors.city}>
          <Input id="city" value={draft.city} invalid={Boolean(errors.city)} onChange={setText(patchEmployer, "city")} />
        </Field>
        <Field label="Province" htmlFor="province" required error={errors.province}>
          <Select id="province" value={draft.province} invalid={Boolean(errors.province)} onChange={setText(patchEmployer, "province")}>
            <option value="">Choose a province</option>
            {PROVINCES.map((province) => (
              <option key={province}>{province}</option>
            ))}
          </Select>
        </Field>
        <Field label="Postal code" htmlFor="postal" required error={errors.postalCode}>
          <Input id="postal" inputMode="numeric" value={draft.postalCode} invalid={Boolean(errors.postalCode)} onChange={setText(patchEmployer, "postalCode")} />
        </Field>
        <Field label="Payroll phone" htmlFor="phone" required error={errors.phone} hint="A South African number, such as 012 000 0140.">
          <Input id="phone" type="tel" value={draft.phone} invalid={Boolean(errors.phone)} onChange={setText(patchEmployer, "phone")} />
        </Field>
      </div>
      <Field label="Payroll email" htmlFor="payroll-email" required error={errors.payrollEmail} hint="Payslip questions from employees can be directed here.">
        <Input id="payroll-email" type="email" value={draft.payrollEmail} invalid={Boolean(errors.payrollEmail)} onChange={setText(patchEmployer, "payrollEmail")} />
      </Field>
    </Shell>
  );
}

const frequencyCopy: Record<Frequency, string> = {
  monthly: "One run for the calendar month. Pay dates are often the 25th or the last working day.",
  weekly: "A separate run each week. Weekly pay is not folded into the monthly run.",
  fortnightly: "A separate run every 14 days.",
};

export function EmployerFrequenciesPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("frequencies");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggle(value: Frequency) {
    const frequencies = draft.frequencies.includes(value) ? draft.frequencies.filter((item) => item !== value) : [...draft.frequencies, value];
    const firstFrequency = frequencies.includes(draft.firstFrequency as Frequency) ? draft.firstFrequency : "";
    patchEmployer({ frequencies, firstFrequency });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerFrequencyErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/period");
  }

  return (
    <Shell stepId="frequencies" title="Select payroll frequencies" description="Choose every cycle this organisation will pay. Each cycle becomes its own payroll run." backTo="/start/employer/address" onSubmit={onSubmit}>
      <div className="grid gap-3">
        {(["monthly", "weekly", "fortnightly"] as Frequency[]).map((value) => (
          <label key={value} className="flex items-start gap-3 rounded-xl border border-line p-4">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={draft.frequencies.includes(value)} onChange={() => toggle(value)} />
            <span>
              <span className="block text-sm font-semibold">{frequencyLabel(value)}</span>
              <span className="mt-1 block text-sm leading-6 text-muted">{frequencyCopy[value]}</span>
            </span>
          </label>
        ))}
      </div>
      {errors.frequencies ? <p className="text-sm text-red-700">{errors.frequencies}</p> : null}
    </Shell>
  );
}

export function EmployerPeriodPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("period");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = employerPeriodErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/employer/plan");
  }

  return (
    <Shell stepId="period" title="Configure the first payroll period" description="Dates use the South African order day, month, year. This period is not calculated." backTo="/start/employer/frequencies" onSubmit={onSubmit}>
      {draft.frequencies.length ? (
        <Field label="First cycle to open" htmlFor="first-frequency" required error={errors.firstFrequency}>
          <Select id="first-frequency" value={draft.firstFrequency} invalid={Boolean(errors.firstFrequency)} onChange={(event) => patchEmployer({ firstFrequency: event.target.value as Frequency })}>
            <option value="">Choose a cycle</option>
            {draft.frequencies.map((value) => (
              <option key={value} value={value}>
                {frequencyLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <FormAlert message="Select a payroll frequency before choosing a period." />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Period start" htmlFor="period-start" required error={errors.periodStart} hint={draft.periodStart ? formatDateShort(draft.periodStart) : "DD/MM/YYYY"}>
          <Input id="period-start" type="date" value={draft.periodStart} invalid={Boolean(errors.periodStart)} onChange={setText(patchEmployer, "periodStart")} />
        </Field>
        <Field label="Period end" htmlFor="period-end" required error={errors.periodEnd} hint={draft.periodEnd ? formatDateShort(draft.periodEnd) : "DD/MM/YYYY"}>
          <Input id="period-end" type="date" value={draft.periodEnd} invalid={Boolean(errors.periodEnd)} onChange={setText(patchEmployer, "periodEnd")} />
        </Field>
        <Field label="Pay date" htmlFor="pay-date" required error={errors.payDate} hint={draft.payDate ? formatDateShort(draft.payDate) : "DD/MM/YYYY"}>
          <Input id="pay-date" type="date" value={draft.payDate} invalid={Boolean(errors.payDate)} onChange={setText(patchEmployer, "payDate")} />
        </Field>
      </div>
      <Note>A monthly sample for Lethabo Foods is 01/11/2026 to 30/11/2026, paid on 25/11/2026. No statutory amounts are produced from these dates.</Note>
    </Shell>
  );
}

export function EmployerPlanPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("plan");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.planId) {
      setError("Choose a paid plan. There is no free plan.");
      return;
    }
    setError("");
    complete("/start/employer/checkout");
  }

  return (
    <Shell stepId="plan" title="Select a subscription plan" description="Prices include VAT at 15% and renew monthly. There is no permanent free plan." backTo="/start/employer/period" onSubmit={onSubmit}>
      {draft.employeeBand === "16–80" ? <Note>The Business plan is listed for this employee band. You can still choose another paid plan.</Note> : null}
      <PlanPicker plans={EMPLOYER_PLANS} value={draft.planId} onChange={(planId) => patchEmployer({ planId })} />
      <FormAlert message={error} />
    </Shell>
  );
}

export function EmployerCheckoutPage() {
  const { draft, patchEmployer, complete } = useEmployerStep("checkout");
  const [card, setCard] = useState<CardDraft>(emptyCard);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const plan = EMPLOYER_PLANS.find((item) => item.id === draft.planId);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!plan) return;
    const next = cardErrors(card);
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    window.setTimeout(() => {
      patchEmployer({ registered: true });
      complete("/start/employer/confirmed");
    }, 700);
  }

  if (!plan) {
    return (
      <Shell stepId="checkout" title="Subscription checkout" description="Checkout shows the plan, VAT and a demonstration card. No payment is taken." backTo="/start/employer/plan" onSubmit={(event) => event.preventDefault()} submitLabel="Choose a plan first">
        <FormAlert message="Choose a subscription plan before checkout." />
        <ButtonLink to="/start/employer/plan" variant="secondary">
          Back to plans
        </ButtonLink>
      </Shell>
    );
  }

  return (
    <Shell stepId="checkout" title="Subscription checkout" description="Review the sample invoice, then enter the demonstration card. No payment is taken." backTo="/start/employer/plan" onSubmit={onSubmit} submitLabel={busy ? "Please wait…" : `Confirm ${formatRand(plan.price)}`} busy={busy}>
      <CheckoutSummary plan={plan} card={card} errors={errors} onChange={setCard} />
    </Shell>
  );
}

export function EmployerConfirmedPage() {
  const { draft, done } = useEmployerStep("confirmed");
  const plan = EMPLOYER_PLANS.find((item) => item.id === draft.planId);
  return (
    <JourneyFrame
      steps={EMPLOYER_STEPS}
      current="confirmed"
      done={done}
      title="Registration confirmed"
      description="The organisation is recorded in this browser session. Payroll has not been calculated and no payment was taken."
      backTo="/start/employer/checkout"
    >
      {draft.registered && plan ? <ConfirmedBody draft={draft} plan={plan} /> : <FormAlert message="Checkout is not complete. The confirmation stays empty until the sample card is accepted." />}
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/start/employer/welcome">Continue to the introduction</ButtonLink>
        {!draft.registered ? (
          <ButtonLink to="/start/employer/checkout" variant="secondary">
            Return to checkout
          </ButtonLink>
        ) : null}
      </div>
    </JourneyFrame>
  );
}

function ConfirmedBody({ draft, plan }: { draft: EmployerDraft; plan: Plan }) {
  const rows = [
    ["Trading name", draft.tradingName],
    ["Registered name", draft.legalName],
    ["Plan", `${plan.name} · ${formatRand(plan.price)} per month, VAT included`],
    ["Frequencies", draft.frequencies.map(frequencyLabel).join(", ")],
    ["First period", draft.periodStart ? `${formatDateShort(draft.periodStart)} – ${formatDateShort(draft.periodEnd)}, pay ${formatDateShort(draft.payDate)}` : "Not set"],
    ["PAYE reference", draft.payeReference],
    ["UIF reference", draft.uifReference],
    ["SDL", draft.sdlChoice === "registered" ? draft.sdlReference : "Not registered"],
  ];
  return (
    <div className="space-y-4">
      <FormSuccess message={`${draft.tradingName || "The organisation"} is registered on the ${plan.name} plan. No money was taken.`} />
      <dl className="divide-y divide-line rounded-xl border border-line">
        {rows.map(([term, detail]) => (
          <div key={term} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[200px_minmax(0,1fr)]">
            <dt className="text-muted">{term}</dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function EmployerWelcomePage() {
  const { state, done } = useEmployerStep("welcome");
  const name = state.employer.tradingName || "Your organisation";
  return (
    <JourneyFrame steps={EMPLOYER_STEPS} current="welcome" done={done} title="Where to begin" description={`${name} has a registration record in this browser. The sample employer workspace is still Khanyisa Retail, so the two are not mixed.`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Organisation setup", "Branches, pay dates, leave and pay codes. You can save and return later.", "/setup"],
          ["Employees", "The sample register belongs to Khanyisa Retail.", "/e/employees"],
          ["Payroll", "Open a run only after the period and pay codes are in place.", "/e/payroll"],
          ["Statutory worksheets", "EMP201 and IRP5 previews stay labelled as samples.", "/e/compliance"],
        ].map(([title, body, href]) => (
          <Link key={title} to={href} className="rounded-xl border border-line p-4 hover:border-blue-200">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-1 block text-sm leading-6 text-muted">{body}</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/setup">Continue organisation setup</ButtonLink>
        <ButtonLink to="/e" variant="secondary">
          Open the Khanyisa workspace
        </ButtonLink>
      </div>
    </JourneyFrame>
  );
}
