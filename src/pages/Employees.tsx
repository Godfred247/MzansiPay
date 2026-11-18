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

export function EmployeesPage() {
  const loading = useShellLoading();
  const { employees, org } = useOrg();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [frequency, setFrequency] = useState("all");
  const [status, setStatus] = useState("all");
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
        title="Employees"
        description="People paid by this organisation. Identity numbers and bank accounts stay masked."
        actions={
          <>
            <Button variant="secondary" onClick={() => exportRows()}>
              Export
            </Button>
            <ButtonLink to={`${base}/employees/new`}>Add employee</ButtonLink>
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
      <PageHeader eyebrow={orgId === "moloto" ? "Moloto Studio" : "Khanyisa Retail"} title="Add employee" description="Required employment and pay details. A full identity number is not collected on this screen." />
      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        <Card>
          <CardTitle title="Personal" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName}>
              <Input id="firstName" invalid={Boolean(errors.firstName)} value={form.firstName} onChange={(event) => set("firstName", event.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <Input id="lastName" invalid={Boolean(errors.lastName)} value={form.lastName} onChange={(event) => set("lastName", event.target.value)} />
            </Field>
            <Field label="Work email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" invalid={Boolean(errors.email)} value={form.email} onChange={(event) => set("email", event.target.value)} />
            </Field>
            <Field label="Mobile" htmlFor="mobile" error={errors.mobile} hint="Stored as entered. Use a fictional number in this demonstration.">
              <Input id="mobile" invalid={Boolean(errors.mobile)} value={form.mobile} onChange={(event) => set("mobile", event.target.value)} />
            </Field>
          </div>
        </Card>
        <Card>
          <CardTitle title="Employment" />
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
        </Card>
        <Card>
          <CardTitle title="Pay and bank" description="Only the last four digits of an account number are kept." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Basic salary for the period (R)" htmlFor="basic" error={errors.basic} hint="No PAYE, UIF or SDL line is created. This demonstration does not calculate statutory amounts.">
              <Input id="basic" inputMode="decimal" invalid={Boolean(errors.basic)} value={form.basic} onChange={(event) => set("basic", event.target.value)} />
            </Field>
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
        </Card>
        <div className="flex gap-2">
          <Button type="submit">Save employee</Button>
          <ButtonLink to={`${base}/employees`} variant="secondary">
            Cancel
          </ButtonLink>
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
        actions={<ButtonLink to={`${base}/employees`} variant="secondary">Back to employees</ButtonLink>}
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
          { id: "pay", label: "Pay" },
          { id: "leave", label: "Leave" },
          { id: "payslips", label: "Payslips" },
          { id: "security", label: "Protected information" },
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
