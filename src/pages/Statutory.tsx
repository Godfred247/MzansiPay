import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FINDING_LABEL, WEEKLY_REVIEW_MARKER, employeeFigures, octoberHistory, payrollFindings, statutoryFrom, type FindingKind } from "../calc.ts";
import { fullName, runEmployees } from "../domain.ts";
import { downloadText, formatDate, formatRand, toCsv } from "../format.ts";
import { IllustrativeBanner } from "../finance.tsx";
import { HISTORY } from "../sample.ts";
import { approveRule, noteCertificate, noteFinding, reviewEmp201, useReview } from "../reviewStore.ts";
import { useApp, useOrg } from "../state.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, Input, PageHeader, Select, Tabs, Textarea } from "../ui.tsx";
import { MonthGrid, SectionLinks } from "../visuals.tsx";

function ProductBanner() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      <p className="font-semibold">MzansiPay prepares these records. It does not submit them to SARS.</p>
      <p>Prepared and Reviewed are product statuses. They are not a receipt from SARS. The employer or the accounting practice files through the official channel.</p>
    </div>
  );
}

function statutoryLinks(base: string) {
  return [
    { to: `${base}/compliance`, label: "Overview" },
    { to: `${base}/compliance/calendar`, label: "Calendar" },
    { to: `${base}/compliance/emp201`, label: "EMP201" },
    { to: `${base}/compliance/emp501`, label: "EMP501" },
    { to: `${base}/compliance/certificates`, label: "IRP5 and IT3(a)" },
    { to: `${base}/compliance/rules`, label: "Tax rules" },
    { to: `${base}/validation`, label: "Validation" },
    { to: `${base}/calculations`, label: "Calculations" },
  ];
}

function useMonthlyPeople() {
  const { employees, runs } = useOrg();
  const monthly = runs.find((run) => run.frequency === "monthly" && run.calculated);
  const people = monthly ? runEmployees(monthly, employees) : [];
  return { monthly, people, totals: statutoryFrom(people), prior: octoberHistory(employees) };
}

export function CompliancePage() {
  const { org, employees, runs } = useOrg();
  const { dispatch } = useApp();
  const { actor, base } = useWorkspace();
  const review = useReview();
  const { totals } = useMonthlyPeople();
  const findings = payrollFindings(employees, runs);
  const openFindings = findings.filter((finding) => !review.notes[finding.id]);
  const [reference, setReference] = useState("");
  const [field, setField] = useState<"paye" | "uif" | "sdl" | "coida">("paye");
  const [error, setError] = useState("");
  const cards = [
    ["PAYE", formatRand(totals.paye), "Employee deduction sample", `${base}/compliance/paye`],
    ["UIF", formatRand(totals.uifTogether), "Employee and employer samples, kept apart", `${base}/compliance/uif`],
    ["SDL", formatRand(totals.sdl), "Employer contribution sample", `${base}/compliance/sdl`],
    ["ETI", formatRand(totals.eti), "No ETI sample is stored", `${base}/compliance/eti`],
  ] as const;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.legalName} title="Statutory compliance" description="Worksheets for the November payroll. Nothing on this screen is sent to SARS." />
      <ProductBanner />
      <SectionLinks items={statutoryLinks(base)} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, amount, hint, href]) => (
          <Link key={label} to={href} className="rounded-xl border border-line bg-white p-4 hover:border-blue-200">
            <p className="text-sm text-muted">{label}</p>
            <p className="num mt-1 text-2xl font-semibold text-teal-700">{amount}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle title="Outstanding statutory tasks" description="Diary items for this organisation. Completing one here does not file a return." />
          <ul className="space-y-3 text-sm">
            <li className="flex items-start justify-between gap-3"><span>Review payroll warnings</span><Badge tone={openFindings.length ? "warning" : "success"}>{openFindings.length} open</Badge></li>
            <li className="flex items-start justify-between gap-3"><span>EMP201 worksheet · 7 Dec 2026</span><Badge tone="info">Prepared</Badge></li>
            <li className="flex items-start justify-between gap-3"><span>EMP501 for 2026/27</span><Badge tone="neutral">Not started</Badge></li>
            <li className="flex items-start justify-between gap-3"><span>IRP5 and IT3(a) pack</span><Badge tone="neutral">Not issued</Badge></li>
          </ul>
        </Card>
        <Card>
          <CardTitle title="Completed statutory tasks" />
          <ul className="space-y-3 text-sm">
            <li className="flex items-start justify-between gap-3"><span>October payslip samples stored</span><Badge tone="success">On file</Badge></li>
            <li className="flex items-start justify-between gap-3"><span>PAYE, UIF, SDL and COIDA references masked</span><Badge tone="success">On file</Badge></li>
            <li className="flex items-start justify-between gap-3"><span>November lines separated into employee and employer groups</span><Badge tone="success">Checked</Badge></li>
          </ul>
        </Card>
      </div>
      <Card>
        <CardTitle title="Upcoming deadlines" />
        <ul className="divide-y divide-line text-sm">
          <li className="flex justify-between py-2"><span>Monthly pay date</span><span>25 Nov 2026</span></li>
          <li className="flex justify-between py-2"><span>EMP201 preparation diary</span><span>7 Dec 2026</span></li>
          <li className="flex justify-between py-2"><span>Interim EMP501</span><span>Not scheduled</span></li>
        </ul>
        <div className="mt-4"><ButtonLink to={`${base}/compliance/calendar`} variant="secondary" size="sm">Open the calendar</ButtonLink></div>
      </Card>
      <Card>
        <CardTitle title="Registrations on file" description="References stay masked. This screen does not show a government logo." />
        <p className="text-sm">PAYE {org.paye} · UIF {org.uif} · SDL {org.sdl} · COIDA {org.coida}</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => {
          event.preventDefault();
          const digits = reference.replace(/\D/g, "");
          if (digits.length < 2) { setError("Enter at least two digits. Only a mask is stored."); return; }
          dispatch({ type: "set-reference", orgId: org.id, field, value: `•••• ${digits.slice(-2)}`, actor });
          setReference("");
          setError("");
        }} noValidate>
          <Field label="Registration" htmlFor="reg-field">
            <Select id="reg-field" value={field} onChange={(event) => setField(event.target.value as typeof field)}>
              <option value="paye">PAYE</option>
              <option value="uif">UIF</option>
              <option value="sdl">SDL</option>
              <option value="coida">COIDA</option>
            </Select>
          </Field>
          <Field label="Reference" htmlFor="reg-value" error={error} hint="Only the last two digits are stored.">
            <Input id="reg-value" invalid={Boolean(error)} value={reference} onChange={(event) => setReference(event.target.value)} />
          </Field>
          <div className="sm:pt-7"><Button type="submit">Save mask</Button></div>
        </form>
      </Card>
    </div>
  );
}

export function ComplianceCalendarPage() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Statutory calendar" description="Diary dates for preparation. A date on this calendar is not a SARS deadline confirmation." />
      <SectionLinks items={statutoryLinks(base)} />
      <Card>
        <CardTitle title="December 2026" description="1 December 2026 is a Tuesday." />
        <MonthGrid year={2026} month={12} marks={[{ day: 7, label: "EMP201 diary", tone: "amber" }]} />
      </Card>
    </div>
  );
}

export function StatutorySummaryPage({ kind }: { kind: "paye" | "uif" | "sdl" | "eti" }) {
  const { org } = useOrg();
  const { base } = useWorkspace();
  const { people, totals } = useMonthlyPeople();
  const title = kind === "paye" ? "PAYE summary" : kind === "uif" ? "UIF summary" : kind === "sdl" ? "SDL summary" : "ETI summary";
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title={title} description="November 2026 monthly run. Figures are the stored samples, read in their own groups." />
      <ProductBanner />
      <IllustrativeBanner />
      {kind === "paye" ? <AmountCard label="PAYE sample" amount={totals.paye} note="Employee deduction. It is not included in employer contributions." /> : null}
      {kind === "uif" ? (
        <div className="grid gap-3 md:grid-cols-3">
          <AmountCard label="UIF employee" amount={totals.uifEmployee} note="Withheld from net pay." />
          <AmountCard label="UIF employer" amount={totals.uifEmployer} note="Not withheld from net pay." />
          <AmountCard label="UIF samples together" amount={totals.uifTogether} note="The two rows added for the worksheet. They stay labelled apart." />
        </div>
      ) : null}
      {kind === "sdl" ? <AmountCard label="SDL sample" amount={totals.sdl} note="Employer contribution. No percentage is applied on this screen." /> : null}
      {kind === "eti" ? <AmountCard label="ETI sample" amount={0} note="No employment tax incentive sample is stored. Zero is a placeholder row, not an ETI calculation." /> : null}
      <DataTable
        rows={people}
        getId={(employee) => employee.id}
        columns={[
          { key: "name", header: "Employee", sortValue: (employee) => fullName(employee), render: (employee) => <Link className="font-medium text-blue-700" to={`${base}/calculations/${employee.id}`}>{fullName(employee)}</Link> },
          { key: "amount", header: "Sample", align: "right", sortValue: (employee) => figureAmount(employee, kind), render: (employee) => <span className="num">{formatRand(figureAmount(employee, kind))}</span> },
        ]}
      />
    </div>
  );
}

function figureAmount(employee: Parameters<typeof employeeFigures>[0], kind: "paye" | "uif" | "sdl" | "eti") {
  const figures = employeeFigures(employee);
  if (kind === "paye") return figures.find((figure) => figure.id === "paye")?.amount ?? 0;
  if (kind === "sdl") return figures.find((figure) => figure.id === "sdl")?.amount ?? 0;
  if (kind === "eti") return 0;
  const employeeUif = figures.find((figure) => figure.id === "uif")?.amount ?? 0;
  const employerUif = figures.find((figure) => figure.id === "uif-er")?.amount ?? 0;
  return employeeUif + employerUif;
}

function AmountCard({ label, amount, note }: { label: string; amount: number; note: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-1 text-3xl font-semibold text-teal-700">{formatRand(amount)}</p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </Card>
  );
}

export function Emp201Page() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  const review = useReview();
  const { monthly, people, totals, prior } = useMonthlyPeople();
  const [period, setPeriod] = useState("2026-11");
  const [confirm, setConfirm] = useState(false);
  const november = period === "2026-11";
  function exportFile() {
    const rows = november
      ? [
          ["PREPARATION FILE. NOT A SARS SUBMISSION."],
          ["Line", "Where it sits", "Sample amount"],
          ["PAYE", "Employee deduction", formatRand(totals.paye)],
          ["UIF employee", "Employee deduction", formatRand(totals.uifEmployee)],
          ["UIF employer", "Employer contribution", formatRand(totals.uifEmployer)],
          ["SDL", "Employer contribution", formatRand(totals.sdl)],
          ["ETI", "Placeholder, not calculated", formatRand(0)],
        ]
      : [
          ["PREPARATION FILE. NOT A SARS SUBMISSION."],
          ["Line", "Where it sits", "Sample amount"],
          ["PAYE", "Stored on October payslips", formatRand(prior.paye)],
          ["UIF employee", "Stored on October payslips", formatRand(prior.uifEmployee)],
          ["UIF employer", "Not stored separately in October history", "Not available"],
          ["SDL", "Not stored separately in October history", "Not available"],
        ];
    downloadText(`emp201-preparation-${period}.csv`, toCsv(rows), "text/csv");
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="EMP201 preparation" description="A worksheet for the reviewer. Exporting it does not submit a return." actions={<Button variant="secondary" onClick={exportFile}>Export preparation file</Button>} />
      <ProductBanner />
      <SectionLinks items={statutoryLinks(base)} />
      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <Field label="Period" htmlFor="emp-period">
          <Select id="emp-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="2026-11">November 2026</option>
            <option value="2026-10">October 2026</option>
          </Select>
        </Field>
        <Card>
          <CardTitle title="Submission status" description="The status belongs to this product." />
          <ol className="grid gap-2 sm:grid-cols-3">
            <li className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm"><span className="block text-xs text-muted">1</span>Prepared</li>
            <li className={`rounded-lg border px-3 py-2 text-sm ${review.emp201Reviewed ? "border-teal-200 bg-teal-50" : "border-blue-600 bg-blue-50"}`}><span className="block text-xs text-muted">2</span>{review.emp201Reviewed ? "Reviewed in product" : "Waiting for review"}</li>
            <li className="rounded-lg border border-line bg-white px-3 py-2 text-sm"><span className="block text-xs text-muted">3</span>Not submitted</li>
          </ol>
          {november && !review.emp201Reviewed ? <Button className="mt-4" onClick={() => setConfirm(true)}>Mark reviewed</Button> : null}
        </Card>
      </div>
      {!monthly && november ? <EmptyState title="No November worksheet" body="Open and calculate a monthly run before preparing EMP201." /> : (
        <Card>
          <CardTitle title={november ? "November totals" : "October totals from stored payslips"} description="Employee UIF and employer UIF are different rows." />
          <WorksheetTable rows={november ? [
            ["PAYE", "Employee deduction", totals.paye],
            ["UIF employee", "Employee deduction", totals.uifEmployee],
            ["UIF employer", "Employer contribution", totals.uifEmployer],
            ["SDL", "Employer contribution", totals.sdl],
            ["ETI", "Placeholder", 0],
          ] : [
            ["PAYE", "October payslip sample", prior.paye],
            ["UIF employee", "October payslip sample", prior.uifEmployee],
          ]} />
          {november ? <p className="mt-3 text-sm">Worksheet rows added together: <span className="num font-semibold">{formatRand(totals.worksheet)}</span>. ETI is zero and is included in that addition.</p> : <p className="mt-3 text-sm text-muted">October history does not store employer UIF or SDL on their own, so those rows are left off rather than estimated.</p>}
        </Card>
      )}
      <Card>
        <CardTitle title="Reconciliation preview" description="November PAYE sample against the October payslip samples. This is not a reconciliation to SARS." />
        <div className="grid gap-3 sm:grid-cols-3">
          <AmountCard label="October PAYE" amount={prior.paye} note="Stored payslips" />
          <AmountCard label="November PAYE" amount={totals.paye} note="Current lines" />
          <AmountCard label="Difference" amount={totals.paye - prior.paye} note="November minus October" />
        </div>
      </Card>
      <Card>
        <CardTitle title="Validation results" description={`${people.length} employees on the monthly run. Open the validation dashboard for warnings.`} action={<ButtonLink to={`${base}/validation`} size="sm" variant="secondary">Open validation</ButtonLink>} />
      </Card>
      <ConfirmDialog open={confirm} title="Mark this worksheet reviewed?" body="Reviewed means a person in MzansiPay has looked at the preparation file. It does not mean the return was submitted." confirmLabel="Mark reviewed" onClose={() => setConfirm(false)} onConfirm={() => { reviewEmp201(); setConfirm(false); }} />
    </div>
  );
}

function WorksheetTable({ rows }: { rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs tracking-wide text-muted uppercase">
        <tr className="border-b border-line"><th className="py-2 font-medium">Line</th><th className="py-2 font-medium">Where it sits</th><th className="py-2 text-right font-medium">Sample</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])} className="border-b border-line">
            <td className="py-2">{row[0]}</td>
            <td className="py-2 text-muted">{row[1]}</td>
            <td className="num py-2 text-right">{typeof row[2] === "number" ? formatRand(row[2]) : row[2]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Emp501Page() {
  const { org, employees } = useOrg();
  const { base } = useWorkspace();
  const { people, totals, prior } = useMonthlyPeople();
  const [mode, setMode] = useState("annual");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(false);
  const rows = useMemo(() => people.map((employee) => {
    const october = prior.slips.find((item) => item.employeeId === employee.id);
    const novemberPaye = employeeFigures(employee).find((figure) => figure.id === "paye")?.amount ?? 0;
    const novemberUif = employeeFigures(employee).find((figure) => figure.id === "uif")?.amount ?? 0;
    return {
      id: employee.id,
      name: fullName(employee),
      octoberPaye: october?.paye ?? 0,
      novemberPaye,
      octoberUif: october?.uif ?? 0,
      novemberUif,
    };
  }).filter((row) => row.name.toLowerCase().includes(query.toLowerCase())), [people, prior.slips, query]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="EMP501 reconciliation" description="Interim and annual layouts use the same stored samples. Neither has been started as a reconciliation, and neither is filed from here." actions={<Button variant="secondary" onClick={() => setConfirm(true)}>Export for review</Button>} />
      <ProductBanner />
      <SectionLinks items={statutoryLinks(base)} />
      <Tabs value={mode} onChange={setMode} tabs={[{ id: "interim", label: "Interim reconciliation" }, { id: "annual", label: "Annual reconciliation" }]} />
      <div className="grid gap-3 md:grid-cols-3">
        <AmountCard label="PAYE difference" amount={totals.paye - prior.paye} note="November sample minus October stored PAYE." />
        <AmountCard label="UIF employee difference" amount={totals.uifEmployee - prior.uifEmployee} note="Employer UIF is not in the October history, so it is not in this difference." />
        <Card>
          <p className="text-sm text-muted">SDL difference</p>
          <p className="mt-1 text-lg font-semibold">Not available</p>
          <p className="mt-2 text-sm text-muted">October SDL was not stored on its own. November SDL sample is {formatRand(totals.sdl)}.</p>
        </Card>
      </div>
      <Field label="Search employees" htmlFor="recon-search"><Input id="recon-search" value={query} placeholder="Name" onChange={(event) => setQuery(event.target.value)} /></Field>
      {rows.length === 0 ? <EmptyState title="No employees match" body="The monthly run has no one with that name." /> : (
        <DataTable
          rows={rows}
          getId={(row) => row.id}
          resetKey={query}
          columns={[
            { key: "name", header: "Employee", sortValue: (row) => row.name, render: (row) => <Link className="font-medium text-blue-700" to={`${base}/compliance/certificates/${row.id}`}>{row.name}</Link> },
            { key: "oct", header: "October PAYE", align: "right", sortValue: (row) => row.octoberPaye, render: (row) => <span className="num">{formatRand(row.octoberPaye)}</span> },
            { key: "nov", header: "November PAYE", align: "right", sortValue: (row) => row.novemberPaye, render: (row) => <span className="num">{formatRand(row.novemberPaye)}</span> },
            { key: "diff", header: "Difference", align: "right", sortValue: (row) => row.novemberPaye - row.octoberPaye, render: (row) => <span className="num">{formatRand(row.novemberPaye - row.octoberPaye)}</span> },
          ]}
        />
      )}
      <Card>
        <CardTitle title="Differences and exceptions" description={mode === "interim" ? "The interim reconciliation is not started." : "The annual reconciliation is not started."} />
        <p className="text-sm">A difference in this table is November’s stored PAYE sample minus October’s stored PAYE sample. It is not an exception raised by SARS.</p>
        <p className="mt-2 text-sm text-muted">{employees.filter((employee) => employee.status === "terminated").length} former employee is excluded from the monthly run and still has an August payslip sample.</p>
      </Card>
      <Card>
        <CardTitle title="Reconciliation history" />
        <EmptyState title="No reconciliation has been exported as a final review pack" body="An export from this screen is a CSV for the people in the organisation. It does not create a reconciliation number." />
      </Card>
      <ConfirmDialog open={confirm} title="Export a review file?" body="The file lists stored PAYE samples. It is not an EMP501 return and it is not sent anywhere." confirmLabel="Download CSV" onClose={() => setConfirm(false)} onConfirm={() => {
        downloadText(`emp501-review-${mode}.csv`, toCsv([["REVIEW FILE. NOT AN EMP501 RETURN."], ["Employee", "October PAYE", "November PAYE", "Difference"], ...rows.map((row) => [row.name, formatRand(row.octoberPaye), formatRand(row.novemberPaye), formatRand(row.novemberPaye - row.octoberPaye)])]), "text/csv");
        setConfirm(false);
      }} />
    </div>
  );
}

export function CertificatesPage() {
  const { org, employees } = useOrg();
  const { base } = useWorkspace();
  const review = useReview();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const rows = employees.filter((employee) => {
    const haystack = `${fullName(employee)} ${employee.employeeNumber}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (status === "active" && employee.status === "terminated") return false;
    if (status === "former" && employee.status !== "terminated") return false;
    return true;
  });
  const noted = Object.keys(review.certificateNotes).length;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Tax certificates" description="IRP5 and IT3(a) previews for the 2026/27 year. No certificate number is issued from MzansiPay." />
      <ProductBanner />
      <SectionLinks items={statutoryLinks(base)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-sm text-muted">In progress</p><p className="num mt-1 text-2xl font-semibold">{employees.filter((employee) => employee.status !== "terminated").length}</p></Card>
        <Card><p className="text-sm text-muted">Former employees</p><p className="num mt-1 text-2xl font-semibold">{employees.filter((employee) => employee.status === "terminated").length}</p></Card>
        <Card><p className="text-sm text-muted">Certificates issued</p><p className="num mt-1 text-2xl font-semibold">0</p><p className="mt-1 text-xs text-muted">{noted} correction note{noted === 1 ? "" : "s"} in this session</p></Card>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Search" htmlFor="cert-search"><Input id="cert-search" value={query} placeholder="Name or employee number" onChange={(event) => setQuery(event.target.value)} /></Field>
        <Field label="Employment" htmlFor="cert-status">
          <Select id="cert-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Everyone</option>
            <option value="active">Current employees</option>
            <option value="former">Former employees</option>
          </Select>
        </Field>
      </div>
      {rows.length === 0 ? <EmptyState title="No certificates match" body="Try another name, or show everyone." /> : (
        <DataTable
          rows={rows}
          getId={(employee) => employee.id}
          resetKey={`${query}-${status}`}
          columns={[
            { key: "name", header: "Employee", sortValue: (employee) => fullName(employee), render: (employee) => <Link className="font-medium text-blue-700" to={`${base}/compliance/certificates/${employee.id}`}>{fullName(employee)}</Link> },
            { key: "no", header: "Number", render: (employee) => employee.employeeNumber },
            { key: "tax", header: "Tax reference", render: (employee) => employee.taxMasked },
            { key: "state", header: "Certificate", render: (employee) => <Badge tone="neutral">{employee.status === "terminated" ? "Final certificate not issued" : "Year in progress"}</Badge> },
          ]}
        />
      )}
      <Card>
        <CardTitle title="Year-end preparation" description="The 2026/27 certificate pack is not open for issue." />
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>October payslip samples are on file.</li>
          <li>November lines are still a payroll in review.</li>
          <li>No IRP5 or IT3(a) number exists.</li>
          <li>A correction note does not create a certificate.</li>
        </ul>
      </Card>
    </div>
  );
}

export function CertificatePage() {
  const { employeeId = "" } = useParams();
  const { employees, org } = useOrg();
  const { base } = useWorkspace();
  const review = useReview();
  const employee = employees.find((item) => item.id === employeeId);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  if (!employee) return <ErrorState title="Employee not found" body="Choose a person from the certificate list." />;
  const slips = HISTORY.filter((item) => item.employeeId === employee.id);
  const novemberPaye = employeeFigures(employee).find((figure) => figure.id === "paye")?.amount ?? 0;
  const storedPaye = slips.reduce((sum, item) => sum + item.paye, 0) + novemberPaye;
  const note = review.certificateNotes[employee.id];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={employee.employeeNumber} title={fullName(employee)} description="Certificate preview for 2026/27. The number has not been issued." actions={<ButtonLink to={`${base}/compliance/certificates`} variant="secondary">All certificates</ButtonLink>} />
      <ProductBanner />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <div className="mx-auto max-w-xl rounded-lg border border-line bg-white p-6">
            <p className="text-xs tracking-wide text-muted uppercase">{org.legalName}</p>
            <h2 className="mt-2 text-xl font-semibold">Sample tax certificate layout</h2>
            <p className="mt-1 text-sm text-muted">Not an IRP5. Not an IT3(a).</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Tax year</dt><dd>2026/27</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Certificate number</dt><dd>Not issued</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Tax reference</dt><dd>{employee.taxMasked}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Stored PAYE samples</dt><dd className="num">{formatRand(storedPaye)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd>{note ? "Correction noted" : "Draft preview"}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-muted">The PAYE figure adds stored payslip samples to the current lines. It is not income assessed by SARS.</p>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardTitle title="Certificate validation" />
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-3"><span>Tax reference on file</span><Badge tone="success">Masked</Badge></li>
              <li className="flex justify-between gap-3"><span>PAYE sample</span><Badge tone={storedPaye > 0 ? "success" : "warning"}>{storedPaye > 0 ? "Stored" : "None"}</Badge></li>
              <li className="flex justify-between gap-3"><span>Certificate number</span><Badge tone="warning">Not issued</Badge></li>
            </ul>
            <p className="mt-3 text-sm text-muted">A certificate that has not been issued cannot be validated as a return.</p>
          </Card>
          <Card>
            <CardTitle title="Request a correction" description="The note stays in this session. No certificate is reissued." />
            <Field label="What should change" htmlFor="cert-reason" error={error}>
              <Textarea id="cert-reason" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} />
            </Field>
            {note ? <p className="mt-3 text-sm text-green-800">Noted: {note}</p> : null}
            <Button className="mt-3" variant="secondary" onClick={() => { if (reason.trim().length < 3) { setError("Enter a correction note."); return; } setError(""); setConfirm(true); }}>Save correction note</Button>
          </Card>
        </div>
      </div>
      <Card>
        <CardTitle title="Certificate history" description="Payslip samples that would feed a later certificate. None of these rows is a certificate." />
        {slips.length === 0 && novemberPaye === 0 ? <EmptyState title="No samples" body="This person has no stored payslip and no current PAYE line." /> : (
          <ul className="divide-y divide-line text-sm">
            {slips.map((slip) => <li key={slip.id} className="flex justify-between py-2"><span>{slip.periodLabel}</span><span className="num">{formatRand(slip.paye)} PAYE sample</span></li>)}
            {novemberPaye > 0 ? <li className="flex justify-between py-2"><span>November 2026 lines</span><span className="num">{formatRand(novemberPaye)} PAYE sample</span></li> : null}
          </ul>
        )}
      </Card>
      <ConfirmDialog open={confirm} title="Save the correction note?" body="The preview stays a draft. No IRP5 or IT3(a) number is created." confirmLabel="Save note" onClose={() => setConfirm(false)} onConfirm={() => { noteCertificate(employee.id, reason.trim()); setConfirm(false); setReason(""); }} />
    </div>
  );
}

const RULES = [
  { id: "2025-26", label: "2025/26", effective: "2025-03-01", published: "Published", detail: "The published labels for the previous year. Payslip samples were not produced from these labels." },
  { id: "2026-27", label: "2026/27", effective: "2026-03-01", published: "Draft", detail: "The draft labels for the current year. Approving them does not recalculate a payslip." },
];

const BANDS = [
  ["Band A", "R0.00 to R100,000.00", "Placeholder"],
  ["Band B", "R100,000.00 to R250,000.00", "Placeholder"],
  ["Band C", "Above R250,000.00", "Placeholder"],
];

export function TaxRulesPage() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  const review = useReview();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Tax rule management" description="Labels and placeholders for the interface. These are not the tax tables for any year, and they do not calculate PAYE." />
      <ProductBanner />
      <SectionLinks items={statutoryLinks(base)} />
      <DataTable
        rows={RULES}
        getId={(rule) => rule.id}
        columns={[
          { key: "year", header: "Tax year", sortValue: (rule) => rule.label, render: (rule) => <Link className="font-medium text-blue-700" to={`${base}/compliance/rules/${rule.id}`}>{rule.label}</Link> },
          { key: "effective", header: "Effective", sortValue: (rule) => rule.effective, render: (rule) => formatDate(rule.effective) },
          { key: "state", header: "State", render: (rule) => <Badge tone={rule.id === "2025-26" || review.rules[rule.id] === "approved" ? "success" : "warning"}>{rule.id === "2025-26" ? "Published" : review.rules[rule.id] === "approved" ? "Approved in this session" : "Draft"}</Badge> },
        ]}
      />
    </div>
  );
}

export function TaxRulePage() {
  const { yearId = "" } = useParams();
  const { base } = useWorkspace();
  const review = useReview();
  const rule = RULES.find((item) => item.id === yearId);
  const [confirm, setConfirm] = useState(false);
  if (!rule) return <ErrorState title="Tax year not found" body="Choose a year from the directory." />;
  const approved = rule.id === "2025-26" || review.rules[rule.id] === "approved";
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`Effective ${formatDate(rule.effective)}`} title={`Tax year ${rule.label}`} description={rule.detail} actions={<ButtonLink to={`${base}/compliance/rules`} variant="secondary">All years</ButtonLink>} />
      <div className="flex flex-wrap gap-2">
        <Badge tone={approved ? "success" : "warning"}>{rule.id === "2025-26" ? "Published" : approved ? "Approved in this session" : "Draft"}</Badge>
        <Badge tone="neutral">Does not recalculate payslips</Badge>
      </div>
      <Card>
        <CardTitle title="Tax bracket configuration" description="Round placeholder bands so the screen can be reviewed. They are not a rate, a rebate or an official table." />
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-muted uppercase"><tr className="border-b border-line"><th className="py-2">Band</th><th className="py-2">Span</th><th className="py-2">Rate</th></tr></thead>
          <tbody>{BANDS.map((band) => <tr key={band[0]} className="border-b border-line"><td className="py-2">{band[0]}</td><td className="py-2">{band[1]}</td><td className="py-2 text-muted">{band[2]}</td></tr>)}</tbody>
        </table>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardTitle title="Rebates and thresholds" description="No rebate amount is stored. A box here would look like a tax calculation, so the amount is left blank." /></Card>
        <Card><CardTitle title="UIF limits" description="The sample lines use the UIF amounts already stored on each employee. This screen does not apply a contribution ceiling." /></Card>
        <Card><CardTitle title="SDL rules" description="SDL amounts are the stored employer lines. This screen does not apply a percentage." /></Card>
        <Card><CardTitle title="Minimum wage rules" description={`The payroll validation warning uses a demonstration marker of ${formatRand(WEEKLY_REVIEW_MARKER)} a week. That marker is not the national minimum wage.`} /></Card>
      </div>
      <Card>
        <CardTitle title="Published rule history" />
        <ul className="space-y-2 text-sm">
          <li>1 Mar 2025 · 2025/26 labels marked published. No payslip was produced from them.</li>
          <li>1 Mar 2026 · 2026/27 labels saved as a draft.</li>
          {review.rules["2026-27"] === "approved" ? <li>This session · 2026/27 draft approved. November samples were not recalculated.</li> : null}
        </ul>
        {rule.id === "2026-27" && !approved ? <Button className="mt-4" onClick={() => setConfirm(true)}>Approve draft</Button> : null}
      </Card>
      <ConfirmDialog open={confirm} title="Approve these labels?" body="Approval records that a reviewer accepted the placeholder labels. PAYE, UIF and SDL samples on the November payroll stay as they are." confirmLabel="Approve draft" onClose={() => setConfirm(false)} onConfirm={() => { approveRule(rule.id); setConfirm(false); }} />
    </div>
  );
}

export function CalculationsPage() {
  const { employees, org } = useOrg();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const rows = employees.filter((employee) => `${fullName(employee)} ${employee.employeeNumber}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payroll calculations" description="Open a person to see each figure and the explanation of where it came from." />
      <SectionLinks items={statutoryLinks(base)} />
      <Field label="Search" htmlFor="calc-search"><Input id="calc-search" value={query} placeholder="Name or employee number" onChange={(event) => setQuery(event.target.value)} /></Field>
      {rows.length === 0 ? <EmptyState title="No employees match" body="Try another name." /> : (
        <DataTable
          rows={rows}
          getId={(employee) => employee.id}
          resetKey={query}
          columns={[
            { key: "name", header: "Employee", sortValue: (employee) => fullName(employee), render: (employee) => <Link className="font-medium text-blue-700" to={`${base}/calculations/${employee.id}`}>{fullName(employee)}</Link> },
            { key: "gross", header: "Gross", align: "right", sortValue: (employee) => employeeFigures(employee).find((figure) => figure.id === "gross")?.amount ?? 0, render: (employee) => <span className="num">{formatRand(employeeFigures(employee).find((figure) => figure.id === "gross")?.amount ?? 0)}</span> },
            { key: "net", header: "Net pay", align: "right", sortValue: (employee) => employeeFigures(employee).find((figure) => figure.id === "net")?.amount ?? 0, render: (employee) => <span className="num text-teal-700">{formatRand(employeeFigures(employee).find((figure) => figure.id === "net")?.amount ?? 0)}</span> },
          ]}
        />
      )}
    </div>
  );
}

export function CalculationPage() {
  const { employeeId = "" } = useParams();
  const { employees, runs } = useOrg();
  const { base } = useWorkspace();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return <ErrorState title="Employee not found" body="Choose a person from the calculation list." />;
  const figures = employeeFigures(employee);
  const run = runs.find((item) => item.employeeIds.includes(employee.id) && item.calculated);
  const gross = figures.find((figure) => figure.id === "gross");
  const deductions = (figures.find((figure) => figure.id === "paye")?.amount ?? 0) + (figures.find((figure) => figure.id === "uif")?.amount ?? 0) + (figures.find((figure) => figure.id === "other-deductions")?.amount ?? 0);
  const net = figures.find((figure) => figure.id === "net");
  const cost = figures.find((figure) => figure.id === "cost");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={employee.employeeNumber} title={fullName(employee)} description={run ? `${run.name}. Each amount is a stored sample, with the working shown under the row.` : "No calculated run includes this person. The rows still show what is stored on the record."} actions={<ButtonLink to={`${base}/calculations`} variant="secondary">All calculations</ButtonLink>} />
      <IllustrativeBanner />
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          <SummaryPill label="Gross earnings" amount={gross?.amount ?? 0} />
          <SummaryPill label="Employee deductions" amount={deductions} />
          <SummaryPill label="Net pay" amount={net?.amount ?? 0} emphasis />
          <SummaryPill label="Employer cost" amount={cost?.amount ?? 0} />
        </div>
        <Card>
          <ol>
            {figures.map((figure) => <FigureRow key={figure.id} figure={figure} />)}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function SummaryPill({ label, amount, emphasis = false }: { label: string; amount: number; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${emphasis ? "border-teal-200 bg-teal-50" : "border-line bg-white"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`num mt-1 text-lg font-semibold ${emphasis ? "text-teal-700" : "text-ink"}`}>{formatRand(amount)}</p>
    </div>
  );
}

function FigureRow({ figure }: { figure: { id: string; label: string; amount: number; emphasis?: "net" | "total"; explanation: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={figure.emphasis ? "font-semibold" : ""}>{figure.label}</span>
        <span className={`num ${figure.emphasis === "net" ? "font-semibold text-teal-700" : figure.emphasis ? "font-semibold" : ""}`}>{formatRand(figure.amount)}</span>
      </button>
      {open ? <p className="pb-3 text-sm leading-6 text-muted">{figure.explanation}</p> : null}
    </li>
  );
}

const FILTERS: { id: "all" | "blocking" | FindingKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blocking", label: "Blocking errors" },
  { id: "salary_anomaly", label: "Salary anomalies" },
  { id: "minimum_wage_marker", label: "Minimum wage warnings" },
  { id: "missing_employee", label: "Missing employee information" },
  { id: "missing_tax", label: "Missing tax references" },
  { id: "invalid_bank", label: "Invalid bank information" },
  { id: "negative_net", label: "Negative net pay" },
  { id: "duplicate", label: "Duplicate payroll" },
];

export function ValidationPage() {
  const { employees, runs, org } = useOrg();
  const { base } = useWorkspace();
  const review = useReview();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const findings = payrollFindings(employees, runs);
  const visible = findings.filter((finding) => {
    if (filter === "blocking") return finding.severity === "blocking";
    if (filter !== "all" && finding.kind !== filter) return false;
    const person = employees.find((employee) => employee.id === finding.employeeId);
    return `${finding.title} ${person ? fullName(person) : ""}`.toLowerCase().includes(query.toLowerCase());
  });
  const blocking = findings.filter((finding) => finding.severity === "blocking" && !review.notes[finding.id]).length;
  const warnings = findings.filter((finding) => finding.severity === "warning" && !review.notes[finding.id]).length;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payroll validation" description="Checks against the stored samples and the demonstration review markers. A warning is not a statutory penalty." />
      <div className={`rounded-lg border px-4 py-3 text-sm ${blocking ? "border-red-200 bg-red-50 text-red-900" : warnings ? "border-amber-200 bg-amber-50 text-amber-950" : "border-teal-200 bg-teal-50 text-teal-900"}`}>
        <p className="font-semibold">{blocking ? `${blocking} blocking error${blocking === 1 ? "" : "s"}` : "No blocking errors"}</p>
        <p>{warnings ? `${warnings} warning${warnings === 1 ? "" : "s"} still need a reviewer.` : "No warnings are waiting."} Noting a warning does not change the payroll lines.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Search" htmlFor="finding-search"><Input id="finding-search" value={query} placeholder="Employee or warning" onChange={(event) => setQuery(event.target.value)} /></Field>
        <Field label="Show" htmlFor="finding-filter">
          <Select id="finding-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            {FILTERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
        </Field>
      </div>
      {visible.length === 0 ? <EmptyState title={filter === "all" && !query ? "Nothing is waiting" : "Nothing in this filter"} body={filter === "blocking" ? "No blocking error was found on the open runs." : "This check did not match a stored sample."} /> : (
        <DataTable
          rows={visible}
          getId={(finding) => finding.id}
          resetKey={`${filter}-${query}`}
          columns={[
            { key: "title", header: "Finding", sortValue: (finding) => finding.title, render: (finding) => <Link className="font-medium text-blue-700" to={`${base}/validation/${finding.id}`}>{finding.title}</Link> },
            { key: "kind", header: "Type", render: (finding) => FINDING_LABEL[finding.kind] },
            { key: "who", header: "Employee", render: (finding) => employees.find((employee) => employee.id === finding.employeeId) ? fullName(employees.find((employee) => employee.id === finding.employeeId)!) : "Run" },
            { key: "state", header: "Status", render: (finding) => <Badge tone={review.notes[finding.id] ? "success" : finding.severity === "blocking" ? "danger" : "warning"}>{review.notes[finding.id] ? "Noted" : finding.severity === "blocking" ? "Blocking" : "Warning"}</Badge> },
          ]}
        />
      )}
    </div>
  );
}

export function ResolveFindingPage() {
  const { findingId = "" } = useParams();
  const { employees, runs } = useOrg();
  const { base } = useWorkspace();
  const review = useReview();
  const finding = payrollFindings(employees, runs).find((item) => item.id === findingId);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!finding) return <ErrorState title="Exception not found" body="It is not on the current validation list." />;
  const person = employees.find((employee) => employee.id === finding.employeeId);
  const saved = review.notes[finding.id];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={finding.severity === "blocking" ? "Blocking error" : "Warning"} title={finding.title} description={finding.detail} actions={<ButtonLink to={`${base}/validation`} variant="secondary">Back to validation</ButtonLink>} />
      <Card>
        <CardTitle title="Resolve the exception" description="A note records the review. The earning and deduction lines stay as stored." />
        {person ? <p className="text-sm"><Link className="font-medium text-blue-700" to={`${base}/calculations/${person.id}`}>{fullName(person)}</Link> · {person.employeeNumber}</p> : null}
        <p className="mt-3 text-sm text-muted">{FINDING_LABEL[finding.kind]}. {finding.kind === "minimum_wage_marker" ? `The weekly marker is ${formatRand(WEEKLY_REVIEW_MARKER)} and is not the national minimum wage.` : "No tax rate was used to raise this item."}</p>
        {saved ? <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">Noted: {saved}</p> : (
          <div className="mt-4 space-y-3">
            <Field label="Review note" htmlFor="finding-note" required error={error}><Textarea id="finding-note" value={note} onChange={(event) => { setNote(event.target.value); setError(""); }} /></Field>
            <Button onClick={() => { if (note.trim().length < 3) { setError("Enter a review note."); return; } noteFinding(finding.id, note.trim()); }}>Note the exception</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
