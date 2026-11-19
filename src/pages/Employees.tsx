import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Employee, Frequency } from "../domain.ts";
import { frequencyLabel, fullName, payslipCatalogue, sumLines } from "../domain.ts";
import { avatarClass, downloadText, formatDate, formatRand, initials, maskAccount, toCsv } from "../format.ts";
import { HISTORY } from "../sample.ts";
import { useApp, useOrg } from "../state.tsx";
import { useShellLoading } from "../shells.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, ConfirmDialog, DataTable, DefinitionList, EmptyState, ErrorState, Field, Input, PageHeader, Select, Tabs } from "../ui.tsx";

export function ArchivedEmployeesPage() {
  return <EmployeesPage archived />;
}

export function EmployeesPage({ archived = false }: { archived?: boolean }) {
  const loading = useShellLoading();
  const { employees, org } = useOrg();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [frequency, setFrequency] = useState("all");
  const [status, setStatus] = useState(archived ? "terminated" : "all");
  const departments = [...new Set(employees.map((employee) => employee.department))];
  const filtered = employees.filter((employee) => {
    const haystack = `${fullName(employee)} ${employee.employeeNumber} ${employee.jobTitle}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (department !== "all" && employee.department !== department) return false;
    if (frequency !== "all" && employee.frequency !== frequency) return false;
    if (status !== "all" && employee.status !== status) return false;
    return true;
  });

  function exportRows(ids?: string[]) {
    const source = ids ? filtered.filter((employee) => ids.includes(employee.id)) : filtered;
    const rows = [
      ["Employee number", "Name", "Job title", "Department", "Site", "Frequency", "Status", "Gross earnings", "Bank"],
      ...source.map((employee) => [
        employee.employeeNumber,
        fullName(employee),
        employee.jobTitle,
        employee.department,
        employee.site,
        frequencyLabel(employee.frequency),
        employee.status,
        formatRand(sumLines(employee.lines).gross),
        `${employee.bank} ${employee.accountMasked}`,
      ]),
    ];
    downloadText(`${org.tradingName.replaceAll(" ", "-").toLowerCase()}-employees.csv`, toCsv(rows), "text/csv");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={org.tradingName}
        title={archived ? "Archived employees" : "Employees"}
        description={archived ? "Employment has ended. Payslips stay available to payroll administrators. Identity numbers stay masked." : "People paid by this organisation. Identity numbers and bank accounts stay masked."}
        actions={
          <>
            <Button variant="secondary" onClick={() => exportRows()}>Export</Button>
            {archived ? <ButtonLink to={`${base}/employees`} variant="secondary">Active directory</ButtonLink> : <ButtonLink to={`${base}/employees/archived`} variant="secondary">Archived</ButtonLink>}
            {archived ? null : <ButtonLink to={`${base}/employees/new`}>Add employee</ButtonLink>}
          </>
        }
      />
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Search" htmlFor="employee-search">
          <Input id="employee-search" value={query} placeholder="Name or employee number" onChange={(event) => setQuery(event.target.value)} />
        </Field>
        <Field label="Department" htmlFor="department">
          <Select id="department" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Pay frequency" htmlFor="frequency">
          <Select id="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)}>
            <option value="all">All frequencies</option>
            <option value="monthly">Monthly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="weekly">Weekly</option>
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="terminated">Terminated</option>
          </Select>
        </Field>
      </div>
      {employees.length === 0 && !loading ? (
        <EmptyState title="No employees yet" body="Add the first employee before you open a payroll run. Pay details can start with basic salary only." action={<ButtonLink to={`${base}/employees/new`}>Add employee</ButtonLink>} />
      ) : (
        <DataTable
          rows={filtered}
          getId={(employee) => employee.id}
          loading={loading}
          resetKey={`${query}|${department}|${frequency}|${status}`}
          selectable
          bulkLabel="Export selected"
          onBulk={(ids) => exportRows(ids)}
          empty={<EmptyState title="No employees match" body="Change the search or filters. On leave is empty until someone is marked on leave." />}
          columns={[
            {
              key: "name",
              header: "Employee",
              sortValue: (employee) => fullName(employee),
              render: (employee) => (
                <div className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white ${avatarClass(employee.id)}`}>{initials(employee.firstName, employee.lastName)}</span>
                  <span>
                    <Link className="font-medium text-blue-700" to={`${base}/employees/${employee.id}`}>
                      {fullName(employee)}
                    </Link>
                    <span className="block text-xs text-muted">{employee.employeeNumber}</span>
                  </span>
                </div>
              ),
            },
            { key: "role", header: "Role", sortValue: (employee) => employee.jobTitle, render: (employee) => employee.jobTitle },
            { key: "department", header: "Department", sortValue: (employee) => employee.department, render: (employee) => employee.department },
            { key: "frequency", header: "Frequency", sortValue: (employee) => employee.frequency, render: (employee) => frequencyLabel(employee.frequency) },
            {
              key: "status",
              header: "Status",
              sortValue: (employee) => employee.status,
              render: (employee) => (
                <Badge tone={employee.status === "active" ? "success" : employee.status === "terminated" ? "neutral" : "warning"}>
                  {employee.status === "on_leave" ? "On leave" : employee.status === "terminated" ? "Terminated" : "Active"}
                </Badge>
              ),
            },
            {
              key: "gross",
              header: "Gross earnings",
              align: "right",
              sortValue: (employee) => sumLines(employee.lines).gross,
              render: (employee) => <span className="num">{employee.lines.length ? formatRand(sumLines(employee.lines).gross) : "—"}</span>,
            },
          ]}
        />
      )}
    </div>
  );
}

export function NewEmployeePage() {
  const { orgId, employees } = useOrg();
  const { dispatch } = useApp();
  const { base, actor } = useWorkspace();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    startDate: "2026-11-01",
    jobTitle: "",
    department: "Stores",
    site: "Sandton",
    frequency: "monthly" as Frequency,
    basic: "",
    bank: "FNB",
    account: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const steps = ["Personal", "Contact", "Employment", "Salary", "Bank", "Review"];

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Enter a first name.";
    if (!form.lastName.trim()) next.lastName = "Enter a last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid work email.";
    if (employees.some((employee) => employee.email.toLowerCase() === form.email.toLowerCase())) next.email = "That email is already on the register.";
    if (!/^(\+27|0)\d{9}$/.test(form.mobile.replaceAll(" ", ""))) next.mobile = "Use a South African number, for example 082 000 0142.";
    if (!form.jobTitle.trim()) next.jobTitle = "Enter a job title.";
    if (!form.startDate) next.startDate = "Enter a start date.";
    const basic = Number(form.basic);
    if (!form.basic || Number.isNaN(basic) || basic <= 0) next.basic = "Enter a basic salary greater than zero.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const sequence = employees.length + 301;
    const employee: Employee = {
      id: `emp-${sequence}`,
      orgId,
      employeeNumber: `EMP-${String(sequence).padStart(4, "0")}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      jobTitle: form.jobTitle.trim(),
      department: form.department,
      site: form.site,
      frequency: form.frequency,
      status: "active",
      startDate: form.startDate,
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      idMasked: "Not captured",
      taxMasked: "Not captured",
      bank: form.bank,
      accountType: "Current",
      accountMasked: form.account ? maskAccount(form.account) : "Not captured",
      manager: "Amara Dube",
      leave: { annual: 15, sick: 10, family: 3 },
      taxableSample: 0,
      expectedNet: basic,
      lines: [{ id: `emp-${sequence}-BASIC`, code: "BASIC", label: "Basic salary", kind: "earning", amount: basic }],
    };
    dispatch({ type: "add-employee", employee, actor });
    navigate(`${base}/employees/${employee.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={orgId === "moloto" ? "Moloto Studio" : "Khanyisa Retail"} title="Add employee" description={`Step ${step + 1} of ${steps.length}: ${steps[step]}. A full identity number is not collected.`} />
      <ol className="flex gap-2 overflow-x-auto text-sm">
        {steps.map((label, index) => (
          <li key={label} className={`shrink-0 rounded-full px-3 py-1 ${index === step ? "bg-blue-600 text-white" : index < step ? "bg-teal-50 text-teal-800" : "bg-white text-muted"}`}>{label}</li>
        ))}
      </ol>
      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        {step === 0 ? <Card>
          <CardTitle title="Personal details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName}>
              <Input id="firstName" invalid={Boolean(errors.firstName)} value={form.firstName} onChange={(event) => set("firstName", event.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <Input id="lastName" invalid={Boolean(errors.lastName)} value={form.lastName} onChange={(event) => set("lastName", event.target.value)} />
            </Field>
            </div>
        </Card> : null}
        {step === 1 ? <Card>
          <CardTitle title="Contact details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Work email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" invalid={Boolean(errors.email)} value={form.email} onChange={(event) => set("email", event.target.value)} />
            </Field>
            <Field label="Mobile" htmlFor="mobile" error={errors.mobile} hint="Stored as entered. Use a fictional number in this demonstration.">
              <Input id="mobile" invalid={Boolean(errors.mobile)} value={form.mobile} onChange={(event) => set("mobile", event.target.value)} />
            </Field>
          </div>
        </Card> : null}
        {step === 2 ? <Card>
          <CardTitle title="Employment details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" htmlFor="jobTitle" error={errors.jobTitle}>
              <Input id="jobTitle" invalid={Boolean(errors.jobTitle)} value={form.jobTitle} onChange={(event) => set("jobTitle", event.target.value)} />
            </Field>
            <Field label="Start date" htmlFor="startDate" error={errors.startDate}>
              <Input id="startDate" type="date" invalid={Boolean(errors.startDate)} value={form.startDate} onChange={(event) => set("startDate", event.target.value)} />
            </Field>
            <Field label="Department" htmlFor="department">
              <Select id="department" value={form.department} onChange={(event) => set("department", event.target.value)}>
                {["Stores", "Finance", "Buying", "Warehouse", "Logistics", "Studio"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Site" htmlFor="site">
              <Select id="site" value={form.site} onChange={(event) => set("site", event.target.value)}>
                {["Sandton", "Rosebank", "Kempton Park", "Cape Town"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pay frequency" htmlFor="pay-frequency">
              <Select id="pay-frequency" value={form.frequency} onChange={(event) => set("frequency", event.target.value as Frequency)}>
                <option value="monthly">Monthly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="weekly">Weekly</option>
              </Select>
            </Field>
          </div>
        </Card> : null}
        {step === 3 ? <Card>
          <CardTitle title="Salary" description="No PAYE, UIF or SDL line is created. This demonstration does not calculate statutory amounts." />
          <Field label="Basic salary for the period (R)" htmlFor="basic" error={errors.basic}>
              <Input id="basic" inputMode="decimal" invalid={Boolean(errors.basic)} value={form.basic} onChange={(event) => set("basic", event.target.value)} />
            </Field>
          </Card> : null}
        {step === 4 ? <Card>
          <CardTitle title="Bank account" description="Only the last four digits are kept. Leave the account blank if it is not known yet." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank" htmlFor="bank">
              <Select id="bank" value={form.bank} onChange={(event) => set("bank", event.target.value)}>
                {["FNB", "Standard Bank", "Absa", "Nedbank", "Capitec"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="Account number" htmlFor="account" hint="Optional. The full number is discarded and the field is stored masked.">
              <Input id="account" value={form.account} onChange={(event) => set("account", event.target.value)} />
            </Field>
          </div>
        </Card> : null}
        {step === 5 ? (
          <Card>
            <CardTitle title="Review" description="Check the record before it joins the register." />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Name</dt><dd>{form.firstName} {form.lastName}</dd></div>
              <div><dt className="text-muted">Email</dt><dd>{form.email}</dd></div>
              <div><dt className="text-muted">Role</dt><dd>{form.jobTitle}</dd></div>
              <div><dt className="text-muted">Basic</dt><dd className="num">{form.basic ? `R${form.basic}` : "—"}</dd></div>
            </dl>
          </Card>
        ) : null}
        <div className="flex gap-2">
          {step > 0 ? <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
          {step < 5 ? (
            <Button type="button" onClick={() => {
              const next: Record<string, string> = {};
              if (step === 0) {
                if (!form.firstName.trim()) next.firstName = "Enter a first name.";
                if (!form.lastName.trim()) next.lastName = "Enter a last name.";
              }
              if (step === 1) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid work email.";
                if (!/^(\+27|0)\d{9}$/.test(form.mobile.replaceAll(" ", ""))) next.mobile = "Use a South African number, for example 082 000 0142.";
              }
              if (step === 2) {
                if (!form.jobTitle.trim()) next.jobTitle = "Enter a job title.";
                if (!form.startDate) next.startDate = "Enter a start date.";
              }
              if (step === 3) {
                const basic = Number(form.basic);
                if (!form.basic || Number.isNaN(basic) || basic <= 0) next.basic = "Enter a basic salary greater than zero.";
              }
              setErrors(next);
              if (!Object.keys(next).length) setStep((value) => value + 1);
            }}>Continue</Button>
          ) : <Button type="submit">Save employee</Button>}
          <ButtonLink to={`${base}/employees`} variant="secondary">Cancel</ButtonLink>
        </div>
      </form>
    </div>
  );
}

export function EmployeeProfilePage() {
  const { employeeId } = useParams();
  const { employees, runs } = useOrg();
  const { state, dispatch } = useApp();
  const { base, actor } = useWorkspace();
  const [tab, setTab] = useState("employment");
  const [confirm, setConfirm] = useState(false);
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) {
    return <ErrorState title="Employee not found" body="This person is not on the current organisation's register." />;
  }
  const slips = payslipCatalogue(state.employees, runs, HISTORY).filter((slip) => slip.employee.id === employee.id);
  const totals = sumLines(employee.lines);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={employee.employeeNumber}
        title={fullName(employee)}
        description={`${employee.jobTitle} · ${employee.department} · ${employee.site}`}
        actions={
          <>
            {employee.status !== "terminated" ? <ButtonLink to={`${base}/employees/${employee.id}/terminate`} variant="danger">End employment</ButtonLink> : null}
            <ButtonLink to={`${base}/employees`} variant="secondary">Back to employees</ButtonLink>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={employee.status === "active" ? "success" : employee.status === "terminated" ? "neutral" : "warning"}>
          {employee.status === "terminated" ? "Terminated" : employee.status === "on_leave" ? "On leave" : "Active"}
        </Badge>
        <Badge tone="info">{frequencyLabel(employee.frequency)}</Badge>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "employment", label: "Employment" },
          { id: "personal", label: "Personal" },
          { id: "pay", label: "Salary" },
          { id: "bank", label: "Bank" },
          { id: "tax", label: "Tax" },
          { id: "benefits", label: "Benefits" },
          { id: "deductions", label: "Deductions" },
          { id: "leave", label: "Leave" },
          { id: "documents", label: "Documents" },
          { id: "history", label: "History" },
          { id: "payslips", label: "Payslips" },
          { id: "security", label: "Protected" },
        ]}
      />
      {tab === "employment" ? (
        <Card>
          <DefinitionList
            items={[
              { term: "Email", detail: employee.email },
              { term: "Mobile", detail: employee.mobile },
              { term: "Start date", detail: formatDate(employee.startDate) },
              { term: "End date", detail: employee.endDate ? formatDate(employee.endDate) : "Current" },
              { term: "Manager", detail: employee.manager },
              { term: "Employee number", detail: employee.employeeNumber },
            ]}
          />
        </Card>
      ) : null}
      {tab === "personal" ? (
        <Card>
          <DefinitionList items={[{ term: "Preferred record name", detail: fullName(employee) }, { term: "Email", detail: employee.email }, { term: "Mobile", detail: employee.mobile }, { term: "Identity number", detail: employee.idMasked }]} />
        </Card>
      ) : null}
      {tab === "bank" ? (
        <Card>
          <CardTitle title="Bank account" description="The account number stays masked. A full number is not stored in this demonstration." />
          <DefinitionList items={[{ term: "Bank", detail: employee.bank }, { term: "Account type", detail: employee.accountType }, { term: "Account", detail: employee.accountMasked }]} />
        </Card>
      ) : null}
      {tab === "tax" ? (
        <Card>
          <CardTitle title="Tax information" description="The tax reference stays masked. PAYE on a payslip is a stored sample, not a SARS assessment." />
          <DefinitionList items={[{ term: "Tax reference", detail: employee.taxMasked }, { term: "Taxable earnings sample", detail: employee.taxableSample > 0 ? formatRand(employee.taxableSample) : "Not supplied" }]} />
        </Card>
      ) : null}
      {tab === "benefits" ? (
        <Card>
          <CardTitle title="Benefits" description="Fund names only. Premiums are not shown as calculated rands." />
          <p className="text-sm">{employee.lines.some((line) => line.code.includes("MED") || line.code.includes("PENS")) ? "Umbrella Health and Southern Retirement Fund are on the current sample lines." : "No benefit fund is on the current lines."}</p>
        </Card>
      ) : null}
      {tab === "deductions" ? (
        <Card>
          <CardTitle title="Deductions on the current lines" description="Employee deductions only. Employer contributions are on the salary tab." />
          {employee.lines.filter((line) => line.kind === "employee_deduction").length === 0 ? <EmptyState title="No deductions stored" body="This employee has no employee-deduction lines in the open period." /> : (
            <ul className="space-y-2 text-sm">{employee.lines.filter((line) => line.kind === "employee_deduction").map((line) => <li key={line.id} className="flex justify-between"><span>{line.label}</span><span className="num">{formatRand(line.amount)}</span></li>)}</ul>
          )}
        </Card>
      ) : null}
      {tab === "documents" ? (
        <Card>
          <CardTitle title="Employment documents" description="Contracts and letters for this person. Restricted files are access-logged." action={<ButtonLink to={`${base}/documents`} size="sm" variant="secondary">Open the library</ButtonLink>} />
          <p className="text-sm text-muted">A contract preview does not include an identity number.</p>
        </Card>
      ) : null}
      {tab === "history" ? (
        <Card>
          <CardTitle title="Employment and salary history" description="Dates already on the record, plus stored payslip nets. A salary review is not calculated here." />
          <DefinitionList items={[{ term: "Started", detail: formatDate(employee.startDate) }, { term: "Ended", detail: employee.endDate ? formatDate(employee.endDate) : "Current" }, { term: "Current gross sample", detail: formatRand(totals.gross) }]} />
        </Card>
      ) : null}
      {tab === "pay" ? (
        <Card>
          <CardTitle title="Current period lines" description="Employer contributions are listed apart from amounts withheld from the employee." />
          {employee.lines.length === 0 ? (
            <EmptyState title="No current pay lines" body="This employee is not in an open pay period." />
          ) : (
            <DefinitionList
              items={[
                { term: "Gross earnings", detail: <span className="num">{formatRand(totals.gross)}</span> },
                { term: "Employee deductions", detail: <span className="num">{formatRand(totals.employeeDeductions)}</span> },
                { term: "Net salary", detail: <span className="num font-semibold text-teal-700">{formatRand(totals.net)}</span> },
                { term: "Employer contributions", detail: <span className="num">{formatRand(totals.employerContributions)}</span> },
                { term: "Employer cost", detail: <span className="num">{formatRand(totals.employerCost)}</span> },
                { term: "Taxable earnings (sample)", detail: employee.taxableSample > 0 ? formatRand(employee.taxableSample) : "Not supplied" },
              ]}
            />
          )}
        </Card>
      ) : null}
      {tab === "leave" ? (
        <Card>
          <DefinitionList
            items={[
              { term: "Annual balance", detail: `${employee.leave.annual} days` },
              { term: "Sick balance", detail: `${employee.leave.sick} days` },
              { term: "Family responsibility", detail: `${employee.leave.family} days` },
            ]}
          />
          <p className="mt-4 text-sm text-muted">Balances are the sample company's records. They are not a statement of statutory leave.</p>
        </Card>
      ) : null}
      {tab === "payslips" ? (
        slips.length === 0 ? (
          <EmptyState title="No payslips" body="A payslip appears here after a run that includes this employee has been calculated." />
        ) : (
          <Card padding={false}>
            <ul className="divide-y divide-line">
              {slips.map((slip) => (
                <li key={slip.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <Link className="font-medium text-blue-700" to={`${base}/payslips/${slip.id}`}>
                    {slip.periodLabel}
                  </Link>
                  <span className="num">{formatRand(sumLines(slip.lines).net)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )
      ) : null}
      {tab === "security" ? (
        <Card>
          <CardTitle title="Protected fields" description="Employees and practitioners see masked values. A reveal request is audited and does not unmask the number." />
          <DefinitionList
            items={[
              { term: "Identity number", detail: employee.idMasked },
              { term: "Tax reference", detail: employee.taxMasked },
              { term: "Bank account", detail: `${employee.bank} · ${employee.accountType} · ${employee.accountMasked}` },
            ]}
          />
          <Button className="mt-4" variant="secondary" onClick={() => setConfirm(true)}>
            Request full number
          </Button>
          <ConfirmDialog
            open={confirm}
            title="This number stays masked"
            body="Viewing a full identity or tax number is logged. In this demonstration the value is not revealed."
            confirmLabel="Log the request"
            onClose={() => setConfirm(false)}
            onConfirm={() => {
              dispatch({ type: "protected-view", employeeName: fullName(employee), actor, orgId: employee.orgId });
              setConfirm(false);
            }}
          />
        </Card>
      ) : null}
    </div>
  );
}

export function TerminateEmployeePage() {
  const { employeeId = "" } = useParams();
  const { employees } = useOrg();
  const { dispatch } = useApp();
  const { base, actor } = useWorkspace();
  const employee = employees.find((item) => item.id === employeeId);
  const [endDate, setEndDate] = useState("2026-11-30");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  if (!employee) return <ErrorState title="Employee not found" body="This person is not on the current register." />;
  if (employee.status === "terminated") {
    return (
      <div className="space-y-4">
        <PageHeader title={`${fullName(employee)} is archived`} description={employee.endDate ? `Employment ended ${formatDate(employee.endDate)}.` : "The record is on the archived list."} />
        <ButtonLink to={`${base}/employees/archived`}>View archived employees</ButtonLink>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow={employee.employeeNumber} title={`End employment for ${fullName(employee)}`} description="The final pay is not calculated here. The person moves to the archived register and drops out of new runs." />
      <Card>
        <div className="space-y-4">
          <Field label="Last working day" htmlFor="end-date" required><Input id="end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field>
          <Field label="Reason" htmlFor="reason" required error={error} hint="Visible to payroll administrators. It is not printed on the payslip.">
            <Input id="reason" value={reason} invalid={Boolean(error)} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Button variant="danger" onClick={() => { if (reason.trim().length < 3 || !endDate) { setError("Enter a reason and a last day."); return; } setError(""); setConfirm(true); }}>Archive employee</Button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirm}
        title="Archive this employee?"
        body={`${fullName(employee)} will leave the active register. Open payroll totals that already include them stay as stored samples.`}
        confirmLabel="Archive"
        tone="danger"
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          dispatch({ type: "terminate-employee", employeeId: employee.id, endDate, reason: reason.trim(), actor });
          setConfirm(false);
        }}
      />
    </div>
  );
}
