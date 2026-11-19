import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { CODES, frequencyLabel, fullName, runEmployees, runStatusMeta, runTotals, sumCode, sumLines } from "../domain.ts";
import { formatDate, formatRand } from "../format.ts";
import { IllustrativeBanner } from "../finance.tsx";
import { HISTORY } from "../sample.ts";
import { useApp, useOrg } from "../state.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, Input, PageHeader, Select, Textarea } from "../ui.tsx";
import { MonthGrid, Pipeline, SectionLinks, SplitBar } from "../visuals.tsx";

const payrollLinks = (base: string) => [
  { to: `${base}/payroll`, label: "Runs" },
  { to: `${base}/payroll/groups`, label: "Groups" },
  { to: `${base}/payroll/calendar`, label: "Calendar" },
  { to: `${base}/payroll/new`, label: "New run" },
  { to: `${base}/payroll/history`, label: "History" },
  { to: `${base}/approvals`, label: "Approvals" },
];

interface Structure {
  id: string;
  name: string;
  basis: "Monthly basic" | "Hourly";
  frequency: "monthly" | "weekly" | "fortnightly";
  effective: string;
  nextReview: string;
  people: string;
  earnings: string[];
  allowances: string[];
  overtime: string;
  bonus: string;
  deductions: string[];
  employer: string[];
  benefits: string[];
}

const STRUCTURES: Structure[] = [
  {
    id: "monthly-salaried",
    name: "Monthly salaried",
    basis: "Monthly basic",
    frequency: "monthly",
    effective: "2026-03-01",
    nextReview: "2027-03-01",
    people: "Stores, finance and buying",
    earnings: ["Basic salary", "Overtime", "Commission"],
    allowances: ["Travel allowance"],
    overtime: "Hours above the contracted week are captured on the run. The rate is stored per employee. This is not a BCEA calculation.",
    bonus: "Commission is once-off when a sales month includes it. It is not part of the recurring basic.",
    deductions: ["PAYE", "UIF employee", "Retirement fund employee", "Medical aid employee"],
    employer: ["UIF employer", "SDL", "Retirement fund employer", "Medical aid employer"],
    benefits: ["Umbrella Health", "Southern Retirement Fund"],
  },
  {
    id: "weekly-hourly",
    name: "Weekly hourly",
    basis: "Hourly",
    frequency: "weekly",
    effective: "2026-04-06",
    nextReview: "2026-10-05",
    people: "Weekend stores",
    earnings: ["Ordinary hours", "Overtime hours"],
    allowances: [],
    overtime: "Overtime hours are entered on the weekly run. No statutory rate is applied in this demonstration.",
    bonus: "No commission on this structure.",
    deductions: ["PAYE", "UIF employee"],
    employer: ["UIF employer", "SDL"],
    benefits: [],
  },
  {
    id: "fortnightly-salaried",
    name: "Fortnightly salaried",
    basis: "Monthly basic",
    frequency: "fortnightly",
    effective: "2026-06-12",
    nextReview: "2026-12-11",
    people: "Logistics",
    earnings: ["Basic salary"],
    allowances: ["Shift allowance"],
    overtime: "Not used.",
    bonus: "Not used.",
    deductions: ["PAYE", "UIF employee"],
    employer: ["UIF employer", "SDL"],
    benefits: [],
  },
];

const GROUPS = [
  { id: "monthly", name: "Monthly salaried", frequency: "Monthly", payDay: "25th", cutoff: "18th of the month", admin: "Amara Dube", people: "6 on the November run" },
  { id: "weekly", name: "Weekly hourly", frequency: "Weekly", payDay: "Friday", cutoff: "Wednesday 12:00", admin: "Helen Okonkwo", people: "1 scheduled" },
  { id: "fortnight", name: "Fortnightly logistics", frequency: "Fortnightly", payDay: "Friday of the pay week", cutoff: "Two working days before pay", admin: "Amara Dube", people: "1 in draft" },
];

export function StructuresPage() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const [basis, setBasis] = useState("all");
  const rows = STRUCTURES.filter((item) => (basis === "all" || item.basis === basis) && item.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Salary structures" description="A structure describes how pay is assembled. It does not calculate PAYE, UIF or SDL." actions={<ButtonLink to={`${base}/structures/new`}>Create structure</ButtonLink>} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Search" htmlFor="structure-search"><Input id="structure-search" value={query} placeholder="Structure name" onChange={(event) => setQuery(event.target.value)} /></Field>
        <Field label="Basis" htmlFor="structure-basis">
          <Select id="structure-basis" value={basis} onChange={(event) => setBasis(event.target.value)}>
            <option value="all">All</option>
            <option>Monthly basic</option>
            <option>Hourly</option>
          </Select>
        </Field>
      </div>
      {rows.length === 0 ? <EmptyState title="No structures match" body="Clear the search or create a new structure." /> : (
        <DataTable
          rows={rows}
          getId={(row) => row.id}
          resetKey={`${query}-${basis}`}
          pageSize={6}
          columns={[
            { key: "name", header: "Structure", sortValue: (row) => row.name, render: (row) => <Link className="font-medium text-blue-700" to={`${base}/structures/${row.id}`}>{row.name}</Link> },
            { key: "basis", header: "Basis", sortValue: (row) => row.basis, render: (row) => row.basis },
            { key: "frequency", header: "Frequency", sortValue: (row) => row.frequency, render: (row) => frequencyLabel(row.frequency) },
            { key: "effective", header: "Effective", sortValue: (row) => row.effective, render: (row) => formatDate(row.effective) },
            { key: "people", header: "Used by", render: (row) => row.people },
          ]}
        />
      )}
    </div>
  );
}

export function StructureCreatePage() {
  const { base } = useWorkspace();
  const [form, setForm] = useState({ name: "", basis: "", frequency: "", effective: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next.name = "Enter a structure name.";
    if (!form.basis) next.basis = "Choose a salary basis.";
    if (!form.frequency) next.frequency = "Choose a frequency.";
    if (!form.effective) next.effective = "Enter the effective date.";
    setErrors(next);
    setSaved(Object.keys(next).length === 0);
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Salary structures" title="Create a salary structure" description="The new structure stays in this screen. It is not applied to employees until a payroll administrator approves an effective date." />
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="s-name" required error={errors.name}><Input id="s-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Basis" htmlFor="s-basis" required error={errors.basis}>
              <Select id="s-basis" value={form.basis} invalid={Boolean(errors.basis)} onChange={(event) => setForm({ ...form, basis: event.target.value })}>
                <option value="">Choose</option>
                <option>Monthly basic</option>
                <option>Hourly</option>
              </Select>
            </Field>
            <Field label="Frequency" htmlFor="s-frequency" required error={errors.frequency}>
              <Select id="s-frequency" value={form.frequency} invalid={Boolean(errors.frequency)} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
                <option value="">Choose</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
              </Select>
            </Field>
            <Field label="Effective date" htmlFor="s-date" required error={errors.effective} hint="DD/MM/YYYY"><Input id="s-date" type="date" value={form.effective} invalid={Boolean(errors.effective)} onChange={(event) => setForm({ ...form, effective: event.target.value })} /></Field>
          </div>
        </Card>
        {saved ? <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">Validation passed. The structure was not written onto employee records.</p> : null}
        <div className="flex gap-2">
          <Button type="submit">Check structure</Button>
          <ButtonLink to={`${base}/structures`} variant="secondary">Back</ButtonLink>
        </div>
      </form>
    </div>
  );
}

export function StructureDetailPage() {
  const { structureId } = useParams();
  const { base } = useWorkspace();
  const structure = STRUCTURES.find((item) => item.id === structureId);
  const [decision, setDecision] = useState("");
  if (!structure) return <ErrorState title="Structure not found" body="Choose a structure from the directory." />;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={frequencyLabel(structure.frequency)} title={structure.name} description={`Effective ${formatDate(structure.effective)}. Next review ${formatDate(structure.nextReview)}. ${structure.people}.`} actions={<ButtonLink to={`${base}/structures`} variant="secondary">All structures</ButtonLink>} />
      <IllustrativeBanner />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardTitle title="Earnings" /><ul className="list-disc space-y-1 pl-5 text-sm">{structure.earnings.map((item) => <li key={item}>{item}</li>)}</ul></Card>
        <Card><CardTitle title="Allowances" />{structure.allowances.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{structure.allowances.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-muted">No allowances on this structure.</p>}</Card>
        <Card><CardTitle title="Overtime" description={structure.overtime} /></Card>
        <Card><CardTitle title="Bonus and commission" description={structure.bonus} /></Card>
        <Card><CardTitle title="Recurring employee deductions" /><ul className="list-disc space-y-1 pl-5 text-sm">{structure.deductions.map((item) => <li key={item}>{item}</li>)}</ul></Card>
        <Card><CardTitle title="Employer contributions" description="These are not deducted from net salary." /><ul className="list-disc space-y-1 pl-5 text-sm">{structure.employer.map((item) => <li key={item}>{item}</li>)}</ul></Card>
      </div>
      <Card>
        <CardTitle title="Benefits on this structure" description="Premiums are not shown. A rand amount here would look like a calculated contribution." />
        {structure.benefits.length ? <p className="text-sm">{structure.benefits.join(" · ")}</p> : <p className="text-sm text-muted">No benefit fund is attached.</p>}
      </Card>
      <Card>
        <CardTitle title="Salary change waiting for approval" description="Sipho Dlamini, sales associate. Proposed from 1 Dec 2026. The current sample lines are unchanged until you approve." />
        <p className="text-sm">Travel allowance moves from a once-off October line to a recurring allowance. No new statutory amount is produced.</p>
        {decision ? <p role="status" className="mt-3 text-sm text-green-800">{decision}</p> : (
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setDecision("Approved for 1 Dec 2026. The November payroll was not recalculated.")}>Approve change</Button>
            <Button variant="danger" onClick={() => setDecision("Returned to the payroll administrator. November pay is unchanged.")}>Send back</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function PayrollGroupsPage() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const rows = GROUPS.filter((group) => group.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payroll groups" description="A group is a set of employees paid on the same cycle. Weekly people are not pulled into the monthly group." actions={<ButtonLink to={`${base}/payroll/groups/new`}>Create group</ButtonLink>} />
      <SectionLinks items={payrollLinks(base)} />
      <Field label="Search" htmlFor="group-search"><Input id="group-search" value={query} placeholder="Group name" onChange={(event) => setQuery(event.target.value)} /></Field>
      {rows.length === 0 ? <EmptyState title="No groups match" body="Try another name, or create a group." /> : (
        <DataTable
          rows={rows}
          getId={(row) => row.id}
          resetKey={query}
          columns={[
            { key: "name", header: "Group", sortValue: (row) => row.name, render: (row) => row.name },
            { key: "frequency", header: "Frequency", sortValue: (row) => row.frequency, render: (row) => row.frequency },
            { key: "pay", header: "Pay day", render: (row) => row.payDay },
            { key: "cutoff", header: "Cutoff", render: (row) => row.cutoff },
            { key: "admin", header: "Administrator", sortValue: (row) => row.admin, render: (row) => row.admin },
            { key: "people", header: "People", render: (row) => row.people },
          ]}
        />
      )}
    </div>
  );
}

export function PayrollGroupCreatePage() {
  const { base } = useWorkspace();
  const [form, setForm] = useState({ name: "", frequency: "", payDay: "", cutoff: "", admin: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next.name = "Enter a group name.";
    if (!form.frequency) next.frequency = "Choose a frequency.";
    if (!form.payDay.trim()) next.payDay = "Enter the pay day.";
    if (!form.cutoff.trim()) next.cutoff = "Enter the cutoff.";
    if (!form.admin.trim()) next.admin = "Name the payroll administrator.";
    setErrors(next);
    setSaved(!Object.keys(next).length);
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Create a payroll group" description="Monthly, weekly and fortnightly groups stay separate." />
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Group name" htmlFor="g-name" required error={errors.name}><Input id="g-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Frequency" htmlFor="g-frequency" required error={errors.frequency}>
              <Select id="g-frequency" value={form.frequency} invalid={Boolean(errors.frequency)} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
                <option value="">Choose</option>
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Fortnightly</option>
              </Select>
            </Field>
            <Field label="Pay day" htmlFor="g-pay" required error={errors.payDay} hint="For example, the 25th or Friday."><Input id="g-pay" value={form.payDay} invalid={Boolean(errors.payDay)} onChange={(event) => setForm({ ...form, payDay: event.target.value })} /></Field>
            <Field label="Cutoff" htmlFor="g-cutoff" required error={errors.cutoff}><Input id="g-cutoff" value={form.cutoff} invalid={Boolean(errors.cutoff)} onChange={(event) => setForm({ ...form, cutoff: event.target.value })} /></Field>
            <Field label="Payroll administrator" htmlFor="g-admin" required error={errors.admin}><Input id="g-admin" value={form.admin} invalid={Boolean(errors.admin)} onChange={(event) => setForm({ ...form, admin: event.target.value })} /></Field>
          </div>
        </Card>
        {saved ? <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">The group passed validation. It is not added to the live November runs.</p> : null}
        <div className="flex gap-2"><Button type="submit">Save group</Button><ButtonLink to={`${base}/payroll/groups`} variant="secondary">Cancel</ButtonLink></div>
      </form>
    </div>
  );
}

export function PayrollCalendarPage() {
  const { org, runs } = useOrg();
  const { base } = useWorkspace();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payroll period calendar" description="November 2026. Pay dates and the EMP201 worksheet date. 1 November 2026 is a Sunday." />
      <SectionLinks items={payrollLinks(base)} />
      <Card>
        <MonthGrid
          year={2026}
          month={11}
          marks={[
            { day: 18, label: "Monthly cutoff", tone: "amber" },
            { day: 20, label: "Weekly pay", tone: "blue" },
            { day: 25, label: "Monthly pay", tone: "teal" },
          ]}
        />
      </Card>
      <DataTable
        rows={runs}
        getId={(run) => run.id}
        columns={[
          { key: "name", header: "Run", sortValue: (run) => run.name, render: (run) => <Link className="font-medium text-blue-700" to={`${base}/payroll/${run.id}`}>{run.name}</Link> },
          { key: "start", header: "Period", sortValue: (run) => run.start, render: (run) => `${formatDate(run.start)} – ${formatDate(run.end)}` },
          { key: "pay", header: "Pay date", sortValue: (run) => run.payDate, render: (run) => formatDate(run.payDate) },
          { key: "status", header: "Status", render: (run) => <Badge tone={runStatusMeta(run.status).tone}>{runStatusMeta(run.status).label}</Badge> },
        ]}
      />
    </div>
  );
}

const createSteps = ["Payroll group", "Employees", "Adjustments", "Open the run"];

export function PayrollCreatePage() {
  const { employees, org } = useOrg();
  const { base } = useWorkspace();
  const [step, setStep] = useState(0);
  const [group, setGroup] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const eligible = employees.filter((employee) => employee.status !== "terminated");
  function next() {
    if (step === 0 && !group) return setError("Choose a payroll group.");
    if (step === 1 && selected.length === 0) return setError("Select at least one employee.");
    setError("");
    setStep((value) => Math.min(createSteps.length - 1, value + 1));
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Create a payroll run" description="Choose the group, the people and any adjustments. This screen does not calculate statutory amounts." />
      <Pipeline steps={createSteps} current={step} />
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {step === 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {GROUPS.map((item) => (
            <button key={item.id} type="button" className={`rounded-xl border p-4 text-left ${group === item.id ? "border-blue-600 bg-blue-50" : "border-line bg-white"}`} onClick={() => setGroup(item.id)}>
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="mt-1 block text-sm text-muted">{item.frequency} · pay {item.payDay}</span>
            </button>
          ))}
        </div>
      ) : null}
      {step === 1 ? (
        eligible.length === 0 ? <EmptyState title="No employees to pay" body="Add an employee before opening a run." /> : (
          <DataTable
            rows={eligible}
            getId={(employee) => employee.id}
            selectable
            onBulk={(ids) => setSelected(ids)}
            bulkLabel="Use selected employees"
            columns={[
              { key: "name", header: "Employee", sortValue: (employee) => fullName(employee), render: (employee) => fullName(employee) },
              { key: "no", header: "Number", render: (employee) => employee.employeeNumber },
              { key: "frequency", header: "Frequency", render: (employee) => frequencyLabel(employee.frequency) },
              { key: "gross", header: "Sample gross", align: "right", sortValue: (employee) => sumLines(employee.lines).gross, render: (employee) => <span className="num">{employee.lines.length ? formatRand(sumLines(employee.lines).gross) : "—"}</span> },
            ]}
          />
        )
      ) : null}
      {step === 2 ? (
        <Card>
          <CardTitle title="Import payroll adjustments" description="A file can add overtime hours or a once-off earning. This demonstration accepts the file name only and does not read a spreadsheet." />
          <Field label="Adjustment file" htmlFor="adjust" hint="Use a name such as november-overtime.csv. The contents are not imported.">
            <Input id="adjust" value={fileName} placeholder="november-overtime.csv" onChange={(event) => setFileName(event.target.value)} />
          </Field>
          {fileName ? <p className="mt-3 text-sm text-muted">{fileName} is noted. No amounts were added.</p> : <p className="mt-3 text-sm text-muted">You can continue without a file.</p>}
        </Card>
      ) : null}
      {step === 3 ? (
        <Card>
          <CardTitle title="Ready to open" description="The November runs already on file stay as they are. Open the monthly run to review earnings, deductions and the calculation summary." />
          <p className="text-sm">Group: {GROUPS.find((item) => item.id === group)?.name}. Employees selected: {selected.length || "the people already on the run"}.</p>
          <div className="mt-4"><ButtonLink to={`${base}/payroll`}>Go to payroll runs</ButtonLink></div>
        </Card>
      ) : null}
      <div className="flex gap-2">
        {step > 0 ? <Button variant="secondary" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
        {step < 3 ? <Button onClick={next}>Continue</Button> : null}
      </div>
    </div>
  );
}

export function PayrollHistoryPage() {
  const { runs, employees, org } = useOrg();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const rows = runs.filter((run) => run.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payroll history" description="Runs kept for this organisation. October totals below come from stored payslip samples." />
      <SectionLinks items={payrollLinks(base)} />
      <Field label="Search" htmlFor="history-search"><Input id="history-search" value={query} placeholder="Run name" onChange={(event) => setQuery(event.target.value)} /></Field>
      {rows.length === 0 ? <EmptyState title="No runs match" body="Khanyisa’s history appears when a run is on file." /> : (
        <DataTable
          rows={rows}
          getId={(run) => run.id}
          resetKey={query}
          columns={[
            { key: "name", header: "Run", sortValue: (run) => run.payDate, render: (run) => <Link className="font-medium text-blue-700" to={`${base}/payroll/${run.id}`}>{run.name}</Link> },
            { key: "status", header: "Status", render: (run) => runStatusMeta(run.status).label },
            { key: "net", header: "Net salaries", align: "right", sortValue: (run) => runTotals(run, employees).net, render: (run) => <span className="num">{run.calculated ? formatRand(runTotals(run, employees).net) : "Not calculated"}</span> },
            { key: "cost", header: "Employer cost", align: "right", sortValue: (run) => runTotals(run, employees).employerCost, render: (run) => <span className="num">{run.calculated ? formatRand(runTotals(run, employees).employerCost) : "—"}</span> },
          ]}
        />
      )}
      <Card>
        <CardTitle title="October 2026 sample" description="Stored payslip nets. Not recalculated." />
        <p className="num text-2xl font-semibold text-teal-700">{formatRand(HISTORY.filter((item) => item.periodLabel.startsWith("October")).reduce((sum, item) => sum + item.net, 0))}</p>
      </Card>
    </div>
  );
}

function useRunContext() {
  const { runId = "" } = useParams();
  const { runs, employees } = useOrg();
  const run = runs.find((item) => item.id === runId);
  const people = run ? runEmployees(run, employees) : [];
  return { run, people, lines: people.flatMap((employee) => employee.lines) };
}

export function PayrollValidatePage() {
  const { run, people } = useRunContext();
  const { base } = useWorkspace();
  if (!run) return <ErrorState title="Run not found" body="Open payroll history and choose a run." />;
  const checks = [
    { name: "Every selected employee has a basic or hourly line", ok: people.every((employee) => employee.lines.some((line) => line.kind === "earning")) },
    { name: "Employee deductions and employer contributions are in separate groups", ok: true },
    { name: "Bank account is on file", ok: people.every((employee) => !employee.accountMasked.includes("Not")) },
    { name: "PAYE sample line present where the run is calculated", ok: !run.calculated || people.every((employee) => employee.lines.some((line) => line.code === CODES.paye)) },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll validation" description={`${run.name}. These checks look at the stored sample. They are not a statutory validation.`} actions={<ButtonLink to={`${base}/payroll/${run.id}`} variant="secondary">Back to the run</ButtonLink>} />
      <ul className="space-y-2">
        {checks.map((check) => (
          <li key={check.name} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <span>{check.name}</span>
            <Badge tone={check.ok ? "success" : "warning"}>{check.ok ? "Passed" : "Needs attention"}</Badge>
          </li>
        ))}
      </ul>
      <ButtonLink to={`${base}/payroll/${run.id}/exceptions`}>Open exceptions</ButtonLink>
    </div>
  );
}

export function PayrollExceptionsPage() {
  const { run, people } = useRunContext();
  const { base } = useWorkspace();
  if (!run) return <ErrorState title="Run not found" body="Choose a run from payroll." />;
  const exceptions = people.flatMap((employee) => {
    const notes: string[] = [];
    const overtime = sumCode(employee.lines, CODES.overtime);
    if (overtime >= 1500) notes.push(`Overtime sample ${formatRand(overtime)} is above the review marker of R1,500.00.`);
    if (employee.accountMasked.includes("Not")) notes.push("Bank account is not on file.");
    if (run.calculated && !employee.lines.some((line) => line.code === CODES.paye)) notes.push("No PAYE sample line is stored.");
    return notes.map((note) => ({ id: `${employee.id}-${note}`, name: fullName(employee), note }));
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll exceptions" description={`${run.name}. A marker is a prompt to look, not an error from SARS.`} />
      {exceptions.length === 0 ? <EmptyState title="No exceptions on this run" body="The stored lines did not trip the review markers." /> : (
        <DataTable rows={exceptions} getId={(row) => row.id} columns={[
          { key: "name", header: "Employee", sortValue: (row) => row.name, render: (row) => row.name },
          { key: "note", header: "What to check", render: (row) => row.note },
        ]} />
      )}
      <ButtonLink to={`${base}/payroll/${run.id}/compare`} variant="secondary">Compare with the previous period</ButtonLink>
    </div>
  );
}

export function PayrollComparePage() {
  const { run, people } = useRunContext();
  const { base } = useWorkspace();
  if (!run) return <ErrorState title="Run not found" body="Choose a run from payroll." />;
  const current = runTotals(run, people.map((employee) => employee));
  const previous = HISTORY.filter((item) => item.periodLabel.startsWith("October") && people.some((employee) => employee.id === item.employeeId));
  const previousNet = previous.reduce((sum, item) => sum + item.net, 0);
  return (
    <div className="space-y-6">
      <PageHeader title="Comparison with the previous period" description="October figures are stored payslip samples. November figures are the current sample lines. Neither set is a statutory calculation." />
      <IllustrativeBanner />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle title="October net, stored" />
          <p className="num text-3xl font-semibold">{formatRand(previousNet)}</p>
          <p className="mt-1 text-sm text-muted">{previous.length} payslips in the comparison.</p>
        </Card>
        <Card>
          <CardTitle title="This run, net salaries" />
          <p className="num text-3xl font-semibold text-teal-700">{run.calculated ? formatRand(current.net) : "Not calculated"}</p>
          <p className="mt-1 text-sm text-muted">{run.calculated ? `Difference ${formatRand(current.net - previousNet)}` : "Calculate the run before comparing."}</p>
        </Card>
      </div>
      {run.calculated ? <Card><SplitBar title="This run, employee side" parts={[{ label: "Net", value: current.net, tone: "teal" }, { label: "Employee deductions", value: current.employeeDeductions, tone: "navy" }]} /></Card> : null}
      <ButtonLink to={`${base}/payroll/${run.id}/submit`}>Continue to submission</ButtonLink>
    </div>
  );
}

export function PayrollSubmitPage() {
  const { run } = useRunContext();
  const { base, mode } = useWorkspace();
  const { dispatch } = useApp();
  const { actor } = useWorkspace();
  const [done, setDone] = useState(false);
  if (!run) return <ErrorState title="Run not found" body="Choose a run from payroll." />;
  const waiting = run.status === "in_review" || run.status === "approved" || run.status === "paid";
  return (
    <div className="space-y-6">
      <PageHeader title="Submit for approval" description={`${run.name} can be submitted by the person who prepared it. Approval stays with the employer.`} />
      <Pipeline steps={["Draft", "In review", "Approved", "Paid"]} current={run.status === "draft" ? 0 : run.status === "in_review" ? 1 : run.status === "approved" ? 2 : run.status === "paid" ? 3 : 0} />
      {done || waiting ? <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">The run is with the approver, or it has already moved on.</p> : null}
      <div className="flex flex-wrap gap-2">
        {run.status === "draft" && run.calculated ? <Button onClick={() => { dispatch({ type: "submit-run", runId: run.id, actor }); setDone(true); }}>Submit for approval</Button> : null}
        <ButtonLink to={`${base}/payroll/${run.id}/pending`} variant="secondary">Approval pending screen</ButtonLink>
        {mode === "employer" ? <ButtonLink to={`${base}/approvals/${run.id}`}>Open the approval</ButtonLink> : null}
      </div>
    </div>
  );
}

export function PayrollPendingPage() {
  const { runs, org } = useOrg();
  const { base } = useWorkspace();
  const waiting = runs.filter((run) => run.status === "in_review");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Approval pending" description="Runs that have been submitted and are waiting for the employer." />
      {waiting.length === 0 ? <EmptyState title="Nothing is pending" body="Submit a draft run, or open a run that is already in review from the payroll list." action={<ButtonLink to={`${base}/payroll`}>Back to payroll</ButtonLink>} /> : waiting.map((run) => (
        <Card key={run.id}>
          <CardTitle title={run.name} description={`Submitted ${run.submittedAt ? formatDate(run.submittedAt) : "this period"} by ${run.preparedBy}.`} />
          <ButtonLink to={`${base}/approvals/${run.id}`}>Review totals</ButtonLink>
        </Card>
      ))}
    </div>
  );
}

export function PayrollRejectedPage() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Rejected payroll" description="Khanyisa has no rejected run in the sample. The layout below shows how a returned week would read." />
      <EmptyState title="No live payroll has been rejected" body="A rejection returns the run to draft and keeps the previous approved figures." />
      <Card>
        <CardTitle title="Sample rejection layout · week of 9 Nov 2026" description="Illustrative only. These words are not attached to a calculated run." />
        <p className="text-sm">Returned by Amara Dube. Reason: overtime hours for Rosebank were not on the adjustment file. Net pay was not changed.</p>
        <div className="mt-4"><ButtonLink to={`${base}/payroll/new`} variant="secondary">Start another run</ButtonLink></div>
      </Card>
    </div>
  );
}

export function PayrollFinalPage() {
  const { runs, employees, org } = useOrg();
  const { base } = useWorkspace();
  const finalRuns = runs.filter((run) => run.status === "approved" || run.status === "paid");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Finalised payroll" description="Approved or paid runs. Payment release is a separate step and does not send money in this demonstration." />
      {finalRuns.length === 0 ? <EmptyState title="No finalised payroll" body="Approve the November run to see it here." action={<ButtonLink to={`${base}/approvals`}>Go to approvals</ButtonLink>} /> : (
        <DataTable
          rows={finalRuns}
          getId={(run) => run.id}
          columns={[
            { key: "name", header: "Run", render: (run) => <Link className="font-medium text-blue-700" to={`${base}/payroll/${run.id}`}>{run.name}</Link> },
            { key: "status", header: "Status", render: (run) => runStatusMeta(run.status).label },
            { key: "net", header: "Net salaries", align: "right", render: (run) => <span className="num text-teal-700">{formatRand(runTotals(run, employees).net)}</span> },
            { key: "by", header: "Approved by", render: (run) => run.approvedBy ?? "—" },
          ]}
        />
      )}
    </div>
  );
}

export function PayrollEmployeeCalcPage() {
  const { employeeId = "" } = useParams();
  const { run, people } = useRunContext();
  const employee = people.find((person) => person.id === employeeId);
  const { base } = useWorkspace();
  if (!run || !employee) return <ErrorState title="Calculation not available" body="This employee is not on the selected run." />;
  const totals = sumLines(employee.lines);
  const earnings = employee.lines.filter((line) => line.kind === "earning");
  const deductions = employee.lines.filter((line) => line.kind === "employee_deduction");
  const employer = employee.lines.filter((line) => line.kind === "employer_contribution");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={employee.employeeNumber} title={fullName(employee)} description={`${run.name}. Each figure is a stored sample line.`} actions={<ButtonLink to={`${base}/payroll/${run.id}`} variant="secondary">Back to the run</ButtonLink>} />
      <IllustrativeBanner />
      <div className="grid gap-4 lg:grid-cols-3">
        <LineCard title="Earnings" lines={earnings} total={totals.gross} />
        <LineCard title="Employee deductions" lines={deductions} total={totals.employeeDeductions} />
        <LineCard title="Employer contributions" lines={employer} total={totals.employerContributions} />
      </div>
      <Card>
        <p className="text-sm text-muted">Net salary</p>
        <p className="num text-3xl font-semibold text-teal-700">{formatRand(totals.net)}</p>
        <p className="mt-2 text-sm">Employer payroll cost {formatRand(totals.employerCost)}. Taxable earnings sample {employee.taxableSample > 0 ? formatRand(employee.taxableSample) : "not supplied"}.</p>
      </Card>
    </div>
  );
}

function LineCard({ title, lines, total }: { title: string; lines: { id: string; label: string; amount: number }[]; total: number }) {
  return (
    <Card>
      <CardTitle title={title} />
      {lines.length === 0 ? <p className="text-sm text-muted">None on this record.</p> : (
        <ul className="space-y-2 text-sm">
          {lines.map((line) => <li key={line.id} className="flex justify-between gap-3"><span>{line.label}</span><span className="num">{formatRand(line.amount)}</span></li>)}
          <li className="flex justify-between gap-3 border-t border-line pt-2 font-semibold"><span>Total</span><span className="num">{formatRand(total)}</span></li>
        </ul>
      )}
    </Card>
  );
}

export function ApprovalQueuePage() {
  const { runs, leave, employees, org } = useOrg();
  const { base } = useWorkspace();
  const payroll = runs.filter((run) => run.status === "in_review");
  const pendingLeave = leave.filter((request) => request.status === "pending");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Approval queue" description="Payroll and leave waiting on this organisation. A practice user can prepare a run. The employer approves it." />
      {payroll.length === 0 && pendingLeave.length === 0 ? <EmptyState title="The queue is clear" body="Submitted payroll and pending leave will appear here." /> : null}
      {payroll.map((run) => (
        <Card key={run.id}>
          <CardTitle title={run.name} description={`Net ${run.calculated ? formatRand(runTotals(run, employees).net) : "not calculated"} · Employer cost ${run.calculated ? formatRand(runTotals(run, employees).employerCost) : "—"}`} />
          <ButtonLink to={`${base}/approvals/${run.id}`}>Open payroll approval</ButtonLink>
        </Card>
      ))}
      {pendingLeave.length > 0 ? (
        <Card>
          <CardTitle title="Leave in the same queue" />
          <ul className="divide-y divide-line text-sm">
            {pendingLeave.map((request) => {
              const person = employees.find((employee) => employee.id === request.employeeId);
              return <li key={request.id} className="flex justify-between py-2"><span>{person ? fullName(person) : "Employee"} · {request.type}</span><Link className="font-medium text-blue-700" to={`${base}/leave`}>Review</Link></li>;
            })}
          </ul>
        </Card>
      ) : null}
      <Card>
        <CardTitle title="Unusual salary change" description="Sipho Dlamini’s travel allowance is proposed as recurring from 1 Dec 2026." action={<ButtonLink to={`${base}/structures/monthly-salaried`} variant="secondary" size="sm">Open the structure</ButtonLink>} />
      </Card>
    </div>
  );
}

export function ApprovalDetailPage() {
  const { runId = "" } = useParams();
  const { runs, employees, audit, org } = useOrg();
  const { base, mode, actor } = useWorkspace();
  const { dispatch } = useApp();
  const [reject, setReject] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const run = runs.find((item) => item.id === runId);
  const people = useMemo(() => (run ? runEmployees(run, employees) : []), [run, employees]);
  if (!run) return <ErrorState title="Approval not found" body="That run is not on this organisation." />;
  const totals = runTotals(run, employees);
  const changes = people.filter((employee) => sumCode(employee.lines, CODES.overtime) > 0 || sumCode(employee.lines, CODES.commission) > 0);
  const missing = people.filter((employee) => employee.accountMasked.includes("Not") || employee.taxMasked.includes("Not"));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title={`Approve ${run.name}`} description="Read the totals, the people who changed, and the missing details before you approve." actions={<ButtonLink to={`${base}/approvals`} variant="secondary">Queue</ButtonLink>} />
      <IllustrativeBanner />
      {run.calculated ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Gross", totals.gross],
            ["Employee deductions", totals.employeeDeductions],
            ["Net salaries", totals.net],
            ["Employer cost", totals.employerCost],
          ].map(([label, value]) => (
            <Card key={String(label)}><p className="text-sm text-muted">{label}</p><p className="num mt-1 text-xl font-semibold text-teal-700">{formatRand(Number(value))}</p></Card>
          ))}
        </div>
      ) : <EmptyState title="This run is not calculated" body="There are no totals to approve." />}
      <Card>
        <CardTitle title="Employee changes against a plain basic salary" description="People with an overtime or commission sample on this run." />
        {changes.length === 0 ? <p className="text-sm text-muted">No overtime or commission samples on this run.</p> : (
          <ul className="divide-y divide-line text-sm">
            {changes.map((employee) => (
              <li key={employee.id} className="flex justify-between py-2">
                <Link className="font-medium text-blue-700" to={`${base}/payroll/${run.id}/employee/${employee.id}`}>{fullName(employee)}</Link>
                <span className="num">{formatRand(sumLines(employee.lines).net)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle title="Missing information" />
        {missing.length === 0 ? <p className="text-sm text-muted">Bank and tax references are on file for everyone in this run. Values stay masked.</p> : (
          <ul className="text-sm">{missing.map((employee) => <li key={employee.id}>{fullName(employee)} is missing a bank or tax reference.</li>)}</ul>
        )}
      </Card>
      {message ? <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        {mode === "employer" && run.status === "in_review" ? <ButtonLink to={`${base}/payroll/${run.id}`}>Approve on the run</ButtonLink> : <Badge tone="neutral">{runStatusMeta(run.status).label}</Badge>}
        <Button variant="secondary" onClick={() => setCorrect(true)}>Request corrections</Button>
        <Button variant="danger" onClick={() => setReject(true)}>Reject</Button>
      </div>
      <Card>
        <CardTitle title="Approval audit" />
        <ul className="space-y-2 text-sm">
          {audit.filter((event) => event.action.toLowerCase().includes("payroll") || event.action.toLowerCase().includes("approv")).slice(0, 5).map((event) => (
            <li key={event.id}><span className="font-medium">{event.action}</span> · {event.actor}</li>
          ))}
        </ul>
      </Card>
      <ConfirmDialog open={reject} title="Reject this payroll?" body="The run returns to the preparer. No payment is released." confirmLabel="Reject payroll" tone="danger" onClose={() => setReject(false)} onConfirm={() => { if (run.status === "in_review") dispatch({ type: "reopen-run", runId: run.id, actor }); setMessage("The run was returned. No payment was released."); setReject(false); }} />
      <ConfirmDialog open={correct} title="Request corrections?" body={<Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What should the preparer change?" />} confirmLabel="Send back" onClose={() => setCorrect(false)} onConfirm={() => { if (note.trim().length < 3) return; if (run.status === "in_review") dispatch({ type: "reopen-run", runId: run.id, actor }); setMessage(`Corrections requested: ${note.trim()}`); setCorrect(false); }} />
    </div>
  );
}

export function LeaveCalendarPage() {
  const { leave, employees, org } = useOrg();
  const { base } = useWorkspace();
  const marks = leave.filter((request) => request.start.startsWith("2026-11") || request.end.startsWith("2026-11")).map((request) => {
    const person = employees.find((employee) => employee.id === request.employeeId);
    return { day: Number(request.start.slice(8, 10)), label: person ? person.firstName : "Leave", tone: request.status === "pending" ? "amber" as const : "teal" as const };
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Leave calendar" description="November 2026. Pending leave is amber. Approved leave is teal." actions={<ButtonLink to={`${base}/leave`} variant="secondary">Request queue</ButtonLink>} />
      <Card><MonthGrid year={2026} month={11} marks={marks} /></Card>
      {leave.length === 0 ? <EmptyState title="No leave on the calendar" body="Requests appear here once employees ask for leave." /> : null}
    </div>
  );
}

export function LeaveTypesPage() {
  const { org } = useOrg();
  const [annual, setAnnual] = useState("15");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Leave types and accrual" description="Opening policy for the sample company. This is not legal advice and it does not create a rand liability." />
      <DataTable
        rows={[
          { id: "annual", name: "Annual", accrual: "1.25 days per month in the sample", balance: "Per employee" },
          { id: "sick", name: "Sick", accrual: "30 days over 36 months in the sample", balance: "Per employee" },
          { id: "family", name: "Family responsibility", accrual: "3 days in a year in the sample", balance: "Per employee" },
        ]}
        getId={(row) => row.id}
        columns={[
          { key: "name", header: "Type", render: (row) => row.name },
          { key: "accrual", header: "Accrual setting", render: (row) => row.accrual },
          { key: "balance", header: "Balance", render: (row) => row.balance },
        ]}
      />
      <Card>
        <CardTitle title="Change the annual accrual note" description="The number is stored on this screen only. Employee balances do not move." />
        <Field label="Annual days in the policy" htmlFor="annual-days" error={error}><Input id="annual-days" value={annual} onChange={(event) => setAnnual(event.target.value)} /></Field>
        {saved ? <p className="mt-3 text-sm text-green-800">{saved}</p> : null}
        <Button className="mt-4" onClick={() => {
          if (!/^\d+$/.test(annual) || Number(annual) < 1 || Number(annual) > 40) { setError("Enter a whole number from 1 to 40."); setSaved(""); return; }
          setError("");
          setSaved(`Annual policy noted as ${annual} days. Balances on employee records were not changed.`);
        }}>Save accrual note</Button>
      </Card>
    </div>
  );
}

export function DocumentPreviewPage() {
  const { docId = "" } = useParams();
  const { documents, org } = useOrg();
  const { dispatch } = useApp();
  const { actor, base } = useWorkspace();
  const document = documents.find((item) => item.id === docId);
  const [open, setOpen] = useState(false);
  if (!document) return <ErrorState title="Document not found" body="Choose a file from the document register." />;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={document.category} title={document.name} description={`${document.sensitivity === "restricted" ? "Restricted" : "Standard"} · updated ${formatDate(document.updated)}.`} actions={<ButtonLink to={`${base}/documents`} variant="secondary">All documents</ButtonLink>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <div className="mx-auto max-w-xl rounded-lg border border-line bg-slate-50 p-8">
            <div className="rounded-md bg-white p-6 shadow-sm">
              <p className="text-xs tracking-wide text-muted uppercase">{org.legalName}</p>
              <h2 className="mt-2 text-xl font-semibold">{document.name}</h2>
              <p className="mt-4 text-sm leading-6 text-muted">This preview is the document cover. The demonstration file does not contain an identity number, a tax number or a bank account.</p>
              <div className="mt-6 h-2 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-2 w-1/2 rounded bg-slate-100" />
              <div className="mt-2 h-2 w-3/5 rounded bg-slate-100" />
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle title="Access" description={document.sensitivity === "restricted" ? "Payroll administrators can open this. A reports viewer cannot." : "HR and payroll administrators can open this."} />
          <Button variant="secondary" onClick={() => setOpen(true)}>Record a view</Button>
        </Card>
      </div>
      <ConfirmDialog open={open} title="Record access?" body="The view is written to the audit history. The file is not downloaded." confirmLabel="Record view" onClose={() => setOpen(false)} onConfirm={() => { dispatch({ type: "protected-view", employeeName: document.name, actor, orgId: document.orgId }); setOpen(false); }} />
    </div>
  );
}
