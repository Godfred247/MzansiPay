import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateShort, formatDateTime, uid } from "../format.ts";
import { Button, ButtonLink, Field, Input, Select, usePageTitle } from "../ui.tsx";
import { useOnboarding } from "./context.tsx";
import { CheckLine, FormAlert, FormSuccess, JourneyFrame, Note } from "./frame.tsx";
import {
  INDUSTRIES,
  SAMPLE_PAYE,
  SAMPLE_SDL,
  SAMPLE_UIF,
  STARTER_CODES,
  WIZARD_STEPS,
  frequencyLabel,
  groupLabel,
  type Frequency,
  type PayGroup,
  type WizardDraft,
} from "./model.ts";
import {
  seatErrors,
  wizardBranchErrors,
  wizardCompanyErrors,
  wizardEarningErrors,
  wizardFrequencyErrors,
  wizardLeaveErrors,
  wizardPayDateErrors,
  wizardTaxErrors,
  wizardYearErrors,
} from "./validate.ts";

function useWizard(stepId: string) {
  const navigate = useNavigate();
  const api = useOnboarding();
  return {
    ...api,
    draft: api.state.wizard,
    done: api.state.done.wizard,
    complete(href: string) {
      api.markDone("wizard", stepId);
      navigate(href);
    },
    save() {
      api.patchWizard({});
      navigate("/setup?saved=1");
    },
  };
}

function Shell({
  stepId,
  title,
  description,
  backTo,
  onSubmit,
  submitLabel,
  children,
}: {
  stepId: string;
  title: string;
  description: string;
  backTo?: string;
  onSubmit: (event: FormEvent) => void;
  submitLabel?: string;
  children: ReactNode;
}) {
  const wizard = useWizard(stepId);
  return (
    <JourneyFrame steps={WIZARD_STEPS} current={stepId} done={wizard.done} title={title} description={description} backTo={backTo} onSave={wizard.save} onSubmit={onSubmit} submitLabel={submitLabel}>
      {children}
    </JourneyFrame>
  );
}

function fillSample(patch: (partial: Partial<WizardDraft>) => void) {
  patch({
    companyTrading: "Lethabo Foods",
    companyLegal: "Lethabo Foods (Pty) Ltd",
    industry: "Food manufacturing",
    payeReference: SAMPLE_PAYE,
    uifReference: SAMPLE_UIF,
    sdlChoice: "registered",
    sdlReference: SAMPLE_SDL,
    branches: [{ id: "head-office", name: "Head office", city: "Centurion", departments: ["Payroll", "Operations"] }],
    frequencies: ["monthly", "weekly"],
    monthlyPayDay: "25",
    weeklyPayDay: "Friday",
    fortnightlyAnchor: "",
    yearStartMonth: "March",
    annualLeaveDays: "15",
    sickLeaveDays: "30",
    familyLeaveDays: "3",
    leaveNotes: "Opening balances are entered per employee later. This policy does not calculate a rand liability.",
    codes: ["basic", "paye", "uif", "uif-er", "sdl"],
    customCodes: [],
    admins: [{ id: "admin-palesa", name: "Palesa Mokoena", email: "palesa.mokoena@lethabo-foods.example", role: "Payroll administrator" }],
  });
}

export function SetupHubPage() {
  usePageTitle("Organisation setup");
  const { state } = useOnboarding();
  const saved = new URLSearchParams(window.location.search).get("saved") === "1";
  const next = WIZARD_STEPS.find((step) => !state.done.wizard.includes(step.id)) ?? WIZARD_STEPS[0];
  const started = Boolean(state.wizard.savedAt || state.done.wizard.length || state.wizard.companyTrading);
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="font-semibold text-navy">
            MzansiPay
          </Link>
          <Link to="/login" className="text-sm font-medium text-blue-700">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Organisation setup</h1>
        <p className="text-sm leading-6 text-muted">Work through the company, pay calendar, leave and pay codes. Progress is kept in this browser so you can leave and come back. It does not change the Khanyisa sample payroll.</p>
        {saved ? <FormSuccess message={`Saved in this browser${state.wizard.savedAt ? ` at ${formatDateTime(state.wizard.savedAt)}` : ""}. Continue when you are ready.`} /> : null}
        {state.wizard.completed ? <FormSuccess message="The setup review is complete. Payroll has still not been calculated." /> : null}
        {!started ? <Note>Setup has not been started. The first step is the company name.</Note> : null}
        <ol className="divide-y divide-line rounded-xl border border-line bg-white">
          {WIZARD_STEPS.map((step, index) => (
            <li key={step.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="text-muted">{index + 1}. </span>
                {step.label}
              </span>
              <span className={state.done.wizard.includes(step.id) ? "text-teal-700" : "text-muted"}>{state.done.wizard.includes(step.id) ? "Done" : "Open"}</span>
            </li>
          ))}
        </ol>
        <ButtonLink to={next.href}>{started ? `Continue from ${next.label}` : "Start setup"}</ButtonLink>
      </main>
    </div>
  );
}

export function WizardCompanyPage() {
  const { state, draft, patchWizard, complete } = useWizard("company");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const employer = state.employer;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardCompanyErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/tax");
  }

  return (
    <Shell stepId="company" title="Company details" description="These details name the organisation on payslips and statutory worksheets. They are not sent to SARS." onSubmit={onSubmit}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => fillSample(patchWizard)}>
          Use the Lethabo Foods sample
        </Button>
        {employer.tradingName ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              patchWizard({
                companyTrading: employer.tradingName,
                companyLegal: employer.legalName,
                industry: employer.industry,
                payeReference: employer.payeReference,
                uifReference: employer.uifReference,
                sdlChoice: employer.sdlChoice,
                sdlReference: employer.sdlReference,
                frequencies: employer.frequencies,
              })
            }
          >
            Copy the registration answers
          </Button>
        ) : null}
      </div>
      <Field label="Trading name" htmlFor="w-trading" required error={errors.companyTrading}>
        <Input id="w-trading" value={draft.companyTrading} invalid={Boolean(errors.companyTrading)} onChange={(event) => patchWizard({ companyTrading: event.target.value })} />
      </Field>
      <Field label="Registered company name" htmlFor="w-legal" required error={errors.companyLegal}>
        <Input id="w-legal" value={draft.companyLegal} invalid={Boolean(errors.companyLegal)} onChange={(event) => patchWizard({ companyLegal: event.target.value })} />
      </Field>
      <Field label="Industry" htmlFor="w-industry" required error={errors.industry}>
        <Select id="w-industry" value={draft.industry} invalid={Boolean(errors.industry)} onChange={(event) => patchWizard({ industry: event.target.value })}>
          <option value="">Choose an industry</option>
          {INDUSTRIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
    </Shell>
  );
}

export function WizardTaxPage() {
  const { draft, patchWizard, complete } = useWizard("tax");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardTaxErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/branches");
  }

  return (
    <Shell stepId="tax" title="Tax registration" description="Store the sample PAYE, UIF and SDL references. MzansiPay does not verify them and does not file a return." backTo="/setup/company" onSubmit={onSubmit}>
      <Note>
        Use {SAMPLE_PAYE}, {SAMPLE_UIF} and {SAMPLE_SDL}. Real references are refused.
      </Note>
      <Field label="PAYE reference" htmlFor="w-paye" required error={errors.payeReference}>
        <Input id="w-paye" value={draft.payeReference} invalid={Boolean(errors.payeReference)} onChange={(event) => patchWizard({ payeReference: event.target.value })} />
      </Field>
      <Field label="UIF reference" htmlFor="w-uif" required error={errors.uifReference} hint="Employee UIF and employer UIF are separate pay codes.">
        <Input id="w-uif" value={draft.uifReference} invalid={Boolean(errors.uifReference)} onChange={(event) => patchWizard({ uifReference: event.target.value })} />
      </Field>
      <Field label="SDL registration" htmlFor="w-sdl-choice" required error={errors.sdlChoice}>
        <Select id="w-sdl-choice" value={draft.sdlChoice} invalid={Boolean(errors.sdlChoice)} onChange={(event) => patchWizard({ sdlChoice: event.target.value as WizardDraft["sdlChoice"], sdlReference: event.target.value === "registered" ? draft.sdlReference : "" })}>
          <option value="">Choose one</option>
          <option value="registered">Registered for SDL</option>
          <option value="not-registered">Not registered for SDL</option>
        </Select>
      </Field>
      {draft.sdlChoice === "registered" ? (
        <Field label="SDL reference" htmlFor="w-sdl" required error={errors.sdlReference}>
          <Input id="w-sdl" value={draft.sdlReference} invalid={Boolean(errors.sdlReference)} onChange={(event) => patchWizard({ sdlReference: event.target.value })} />
        </Field>
      ) : null}
    </Shell>
  );
}

export function WizardBranchesPage() {
  const { draft, patchWizard, complete } = useWizard("branches");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [department, setDepartment] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardBranchErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/frequency");
  }

  return (
    <Shell stepId="branches" title="Branches and departments" description="Employees are attached to a branch and a department. Add the places you pay people." backTo="/setup/tax" onSubmit={onSubmit}>
      {draft.branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm font-medium">No branches yet</p>
          <p className="mt-1 text-sm text-muted">Add a head office, then its departments.</p>
        </div>
      ) : null}
      {errors.branches ? <p className="text-sm text-red-700">{errors.branches}</p> : null}
      {draft.branches.map((branch) => (
        <div key={branch.id} className="space-y-3 rounded-xl border border-line p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Branch name" htmlFor={`${branch.id}-name`} required error={errors[`${branch.id}-name`]}>
              <Input id={`${branch.id}-name`} value={branch.name} invalid={Boolean(errors[`${branch.id}-name`])} onChange={(event) => patchWizard({ branches: draft.branches.map((item) => (item.id === branch.id ? { ...item, name: event.target.value } : item)) })} />
            </Field>
            <Field label="City" htmlFor={`${branch.id}-city`} required error={errors[`${branch.id}-city`]}>
              <Input id={`${branch.id}-city`} value={branch.city} invalid={Boolean(errors[`${branch.id}-city`])} onChange={(event) => patchWizard({ branches: draft.branches.map((item) => (item.id === branch.id ? { ...item, city: event.target.value } : item)) })} />
            </Field>
          </div>
          <div>
            <p className="text-sm font-medium">Departments <span className="text-xs font-medium text-red-700">Required</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {branch.departments.map((name) => (
                <button key={name} type="button" className="rounded-md bg-slate-100 px-2 py-1 text-sm" onClick={() => patchWizard({ branches: draft.branches.map((item) => (item.id === branch.id ? { ...item, departments: item.departments.filter((departmentName) => departmentName !== name) } : item)) })}>
                  {name} ×
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                aria-label={`Department for ${branch.name || "branch"}`}
                value={department[branch.id] ?? ""}
                onChange={(event) => setDepartment({ ...department, [branch.id]: event.target.value })}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const name = (department[branch.id] ?? "").trim();
                  if (!name) return;
                  patchWizard({ branches: draft.branches.map((item) => (item.id === branch.id ? { ...item, departments: [...item.departments, name] } : item)) });
                  setDepartment({ ...department, [branch.id]: "" });
                }}
              >
                Add
              </Button>
            </div>
            {errors[`${branch.id}-departments`] ? <p className="mt-1 text-sm text-red-700">{errors[`${branch.id}-departments`]}</p> : null}
          </div>
          <Button type="button" variant="danger" onClick={() => patchWizard({ branches: draft.branches.filter((item) => item.id !== branch.id) })}>
            Remove branch
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => patchWizard({ branches: [...draft.branches, { id: uid("branch"), name: "", city: "", departments: [] }] })}>
        Add a branch
      </Button>
    </Shell>
  );
}

export function WizardFrequencyPage() {
  const { draft, patchWizard, complete } = useWizard("frequency");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggle(value: Frequency) {
    const frequencies = draft.frequencies.includes(value) ? draft.frequencies.filter((item) => item !== value) : [...draft.frequencies, value];
    patchWizard({ frequencies });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardFrequencyErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/pay-dates");
  }

  return (
    <Shell stepId="frequency" title="Payroll frequency" description="Each frequency is a separate payroll run. Selecting weekly does not add those employees to the monthly run." backTo="/setup/branches" onSubmit={onSubmit}>
      {(["monthly", "weekly", "fortnightly"] as Frequency[]).map((value) => (
        <label key={value} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={draft.frequencies.includes(value)} onChange={() => toggle(value)} />
          {frequencyLabel(value)}
        </label>
      ))}
      {errors.frequencies ? <p className="text-sm text-red-700">{errors.frequencies}</p> : null}
    </Shell>
  );
}

export function WizardPayDatesPage() {
  const { draft, patchWizard, complete } = useWizard("pay-dates");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardPayDateErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/year");
  }

  return (
    <Shell stepId="pay-dates" title="Pay dates" description="Choose when each selected cycle is paid. Dates are shown day, month, year." backTo="/setup/frequency" onSubmit={onSubmit}>
      {draft.frequencies.length === 0 ? <FormAlert message="Select a payroll frequency first. Pay dates follow the cycles you chose." /> : null}
      {draft.frequencies.includes("monthly") ? (
        <Field label="Monthly pay day" htmlFor="monthly-day" required error={errors.monthlyPayDay} hint="Many employers pay on the 25th or the last working day.">
          <Select id="monthly-day" value={draft.monthlyPayDay} invalid={Boolean(errors.monthlyPayDay)} onChange={(event) => patchWizard({ monthlyPayDay: event.target.value })}>
            <option value="">Choose a day</option>
            <option value="15">15th</option>
            <option value="25">25th</option>
            <option value="28">28th</option>
            <option value="last">Last working day</option>
          </Select>
        </Field>
      ) : null}
      {draft.frequencies.includes("weekly") ? (
        <Field label="Weekly pay day" htmlFor="weekly-day" required error={errors.weeklyPayDay}>
          <Select id="weekly-day" value={draft.weeklyPayDay} invalid={Boolean(errors.weeklyPayDay)} onChange={(event) => patchWizard({ weeklyPayDay: event.target.value })}>
            <option value="">Choose a weekday</option>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
              <option key={day}>{day}</option>
            ))}
          </Select>
        </Field>
      ) : null}
      {draft.frequencies.includes("fortnightly") ? (
        <Field label="First fortnightly pay date" htmlFor="fortnight" required error={errors.fortnightlyAnchor} hint={draft.fortnightlyAnchor ? formatDateShort(draft.fortnightlyAnchor) : "The next date falls 14 days later."}>
          <Input id="fortnight" type="date" value={draft.fortnightlyAnchor} invalid={Boolean(errors.fortnightlyAnchor)} onChange={(event) => patchWizard({ fortnightlyAnchor: event.target.value })} />
        </Field>
      ) : null}
    </Shell>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function WizardYearPage() {
  const { draft, patchWizard, complete } = useWizard("year");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardYearErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/leave");
  }

  return (
    <Shell stepId="year" title="Financial year" description="The tax year used for IRP5 runs from March to February. Your financial year can start in a different month. This choice does not file anything." backTo="/setup/pay-dates" onSubmit={onSubmit}>
      <Field label="Financial year starts" htmlFor="year-start" required error={errors.yearStartMonth}>
        <Select id="year-start" value={draft.yearStartMonth} invalid={Boolean(errors.yearStartMonth)} onChange={(event) => patchWizard({ yearStartMonth: event.target.value })}>
          <option value="">Choose a month</option>
          {MONTHS.map((month) => (
            <option key={month}>{month}</option>
          ))}
        </Select>
      </Field>
      <Note>March matches the South African tax year. IRP5 and IT3(a) previews in the workspace stay samples either way.</Note>
    </Shell>
  );
}

export function WizardLeavePage() {
  const { draft, patchWizard, complete } = useWizard("leave");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardLeaveErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/earnings");
  }

  return (
    <Shell stepId="leave" title="Leave policy" description="Enter the opening policy in days. MzansiPay does not turn these days into a rand amount, and this form is not legal advice." backTo="/setup/year" onSubmit={onSubmit}>
      <Note>A common starting sample is 15 days annual leave, 30 days sick leave over a 36-month cycle, and 3 days family responsibility leave.</Note>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Annual leave days" htmlFor="annual" required error={errors.annualLeaveDays}>
          <Input id="annual" inputMode="numeric" value={draft.annualLeaveDays} invalid={Boolean(errors.annualLeaveDays)} onChange={(event) => patchWizard({ annualLeaveDays: event.target.value })} />
        </Field>
        <Field label="Sick leave days" htmlFor="sick" required error={errors.sickLeaveDays} hint="Over a 36-month cycle in the sample.">
          <Input id="sick" inputMode="numeric" value={draft.sickLeaveDays} invalid={Boolean(errors.sickLeaveDays)} onChange={(event) => patchWizard({ sickLeaveDays: event.target.value })} />
        </Field>
        <Field label="Family responsibility days" htmlFor="family" required error={errors.familyLeaveDays}>
          <Input id="family" inputMode="numeric" value={draft.familyLeaveDays} invalid={Boolean(errors.familyLeaveDays)} onChange={(event) => patchWizard({ familyLeaveDays: event.target.value })} />
        </Field>
      </div>
      <Field label="Notes for the payroll administrator" htmlFor="leave-notes" hint="Optional. Visible to administrators, not printed on the payslip.">
        <Input id="leave-notes" value={draft.leaveNotes} onChange={(event) => patchWizard({ leaveNotes: event.target.value })} />
      </Field>
    </Shell>
  );
}

export function WizardEarningsPage() {
  const { draft, patchWizard, complete } = useWizard("earnings");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState({ name: "", group: "earning" as PayGroup });

  function toggle(id: string) {
    const codes = draft.codes.includes(id) ? draft.codes.filter((item) => item !== id) : [...draft.codes, id];
    patchWizard({ codes });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = wizardEarningErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/admins");
  }

  return (
    <Shell stepId="earnings" title="Earnings and deductions" description="Employee earnings, employee deductions and employer contributions stay in three groups. Nothing on this page is a calculated amount." backTo="/setup/leave" onSubmit={onSubmit}>
      {(["earning", "deduction", "employer"] as PayGroup[]).map((group) => (
        <fieldset key={group}>
          <legend className="text-sm font-semibold">{groupLabel(group)}</legend>
          <div className="mt-2 space-y-2">
            {STARTER_CODES.filter((code) => code.group === group).map((code) => (
              <label key={code.id} className="flex items-start gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={draft.codes.includes(code.id)} onChange={() => toggle(code.id)} />
                <span>
                  <span className="font-medium">{code.name}</span>
                  <span className="mt-0.5 block text-muted">{code.note}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {draft.customCodes.map((code) => (
        <div key={code.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
          <span>
            {code.name} · {groupLabel(code.group)}
          </span>
          <Button type="button" variant="ghost" onClick={() => patchWizard({ customCodes: draft.customCodes.filter((item) => item.id !== code.id) })}>
            Remove
          </Button>
        </div>
      ))}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <Field label="Custom pay code" htmlFor="custom-code" error={errors.codes}>
          <Input id="custom-code" value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} />
        </Field>
        <Field label="Group" htmlFor="custom-group">
          <Select id="custom-group" value={custom.group} onChange={(event) => setCustom({ ...custom, group: event.target.value as PayGroup })}>
            <option value="earning">Employee earning</option>
            <option value="deduction">Employee deduction</option>
            <option value="employer">Employer contribution</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!custom.name.trim()) return;
              patchWizard({ customCodes: [...draft.customCodes, { id: uid("code"), name: custom.name.trim(), group: custom.group }] });
              setCustom({ name: "", group: custom.group });
            }}
          >
            Add code
          </Button>
        </div>
      </div>
    </Shell>
  );
}

export function WizardAdminsPage() {
  const { draft, patchWizard, complete } = useWizard("admins");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = seatErrors(draft.admins);
    setErrors(next);
    if (!Object.keys(next).length) complete("/setup/review");
  }

  return (
    <Shell stepId="admins" title="Payroll administrator invitations" description="Invite the people who will run payroll. The invitation is stored here and is not emailed." backTo="/setup/earnings" onSubmit={onSubmit}>
      {draft.admins.length === 0 ? <Note>No administrators invited yet. You can finish setup and invite them from organisation settings.</Note> : null}
      {draft.admins.map((seat) => (
        <div key={seat.id} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
          <Field label="Name" htmlFor={`${seat.id}-name`} required error={errors[`${seat.id}-name`]}>
            <Input id={`${seat.id}-name`} value={seat.name} invalid={Boolean(errors[`${seat.id}-name`])} onChange={(event) => patchWizard({ admins: draft.admins.map((item) => (item.id === seat.id ? { ...item, name: event.target.value } : item)) })} />
          </Field>
          <Field label="Work email" htmlFor={`${seat.id}-email`} required error={errors[`${seat.id}-email`]}>
            <Input id={`${seat.id}-email`} type="email" value={seat.email} invalid={Boolean(errors[`${seat.id}-email`])} onChange={(event) => patchWizard({ admins: draft.admins.map((item) => (item.id === seat.id ? { ...item, email: event.target.value } : item)) })} />
          </Field>
          <Field label="Role" htmlFor={`${seat.id}-role`} required error={errors[`${seat.id}-role`]}>
            <Select id={`${seat.id}-role`} value={seat.role} onChange={(event) => patchWizard({ admins: draft.admins.map((item) => (item.id === seat.id ? { ...item, role: event.target.value } : item)) })}>
              <option>Payroll administrator</option>
              <option>HR administrator</option>
              <option>Reports viewer</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="danger" onClick={() => patchWizard({ admins: draft.admins.filter((item) => item.id !== seat.id) })}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => patchWizard({ admins: [...draft.admins, { id: uid("admin"), name: "", email: "", role: "Payroll administrator" }] })}>
        Add an administrator
      </Button>
    </Shell>
  );
}

export function WizardReviewPage() {
  const { draft, patchWizard, markDone } = useWizard("review");
  const [checked, setChecked] = useState(draft.completed);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!checked) {
      setError("Confirm that you have reviewed the setup.");
      return;
    }
    patchWizard({ completed: true });
    markDone("wizard", "review");
    setError("");
  }

  const payDates = [
    draft.frequencies.includes("monthly") ? `Monthly: ${draft.monthlyPayDay === "last" ? "last working day" : `the ${draft.monthlyPayDay}th`}` : "",
    draft.frequencies.includes("weekly") ? `Weekly: ${draft.weeklyPayDay}` : "",
    draft.frequencies.includes("fortnightly") && draft.fortnightlyAnchor ? `Fortnightly from ${formatDateShort(draft.fortnightlyAnchor)}` : "",
  ].filter(Boolean);

  return (
    <Shell stepId="review" title="Final review" description="Read the setup before you finish. Confirming it does not calculate payroll or submit a statutory return." backTo="/setup/admins" onSubmit={onSubmit} submitLabel="Finish setup">
      {draft.completed ? <FormSuccess message="Organisation setup is marked complete in this browser. No payroll was calculated." /> : null}
      <ReviewBlock title="Company" href="/setup/company" lines={[draft.companyTrading, draft.companyLegal, draft.industry]} />
      <ReviewBlock title="Tax registration" href="/setup/tax" lines={[`PAYE ${draft.payeReference || "Not entered"}`, `UIF ${draft.uifReference || "Not entered"}`, draft.sdlChoice === "registered" ? `SDL ${draft.sdlReference}` : "SDL not registered"]} />
      <ReviewBlock title="Branches" href="/setup/branches" lines={draft.branches.length ? draft.branches.map((branch) => `${branch.name || "Unnamed"}, ${branch.city}: ${branch.departments.join(", ") || "No departments"}`) : ["No branches yet"]} />
      <ReviewBlock title="Pay calendar" href="/setup/frequency" lines={[draft.frequencies.map(frequencyLabel).join(", ") || "No frequency", ...payDates, draft.yearStartMonth ? `Financial year starts in ${draft.yearStartMonth}` : "Financial year not set"]} />
      <ReviewBlock title="Leave" href="/setup/leave" lines={[`Annual ${draft.annualLeaveDays || "—"} days`, `Sick ${draft.sickLeaveDays || "—"} days`, `Family responsibility ${draft.familyLeaveDays || "—"} days`]} />
      <ReviewBlock
        title="Pay codes"
        href="/setup/earnings"
        lines={STARTER_CODES.filter((code) => draft.codes.includes(code.id))
          .concat(draft.customCodes.map((code) => ({ ...code, note: "" })))
          .map((code) => `${code.name} · ${groupLabel(code.group)}`)}
      />
      <ReviewBlock title="Administrators" href="/setup/admins" lines={draft.admins.length ? draft.admins.map((seat) => `${seat.name} · ${seat.role}`) : ["No invitations yet"]} />
      <CheckLine id="review-check" checked={checked} onChange={setChecked} label="I have reviewed this setup. I understand payroll has not been calculated." />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {draft.completed ? (
        <ButtonLink to="/e">Open the sample employer workspace</ButtonLink>
      ) : null}
    </Shell>
  );
}

function ReviewBlock({ title, href, lines }: { title: string; href: string; lines: string[] }) {
  return (
    <section className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link to={href} className="text-sm font-medium text-blue-700">
          Edit
        </Link>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {lines.filter(Boolean).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
