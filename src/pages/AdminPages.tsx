import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { byDepartment, paymentStatusMeta, runEmployees, sumCode, sumLines } from "../domain.ts";
import { downloadText, formatDate, formatDateTime, formatRand, toCsv, uid } from "../format.ts";
import { IllustrativeBanner, PayrollStatement } from "../finance.tsx";
import { EMPLOYER_INVOICES, EMPLOYER_PLANS, HISTORY } from "../sample.ts";
import { useApp, useOrg } from "../state.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, ConfirmDialog, DefinitionList, EmptyState, ErrorState, Field, Input, PageHeader, Select, Tabs } from "../ui.tsx";

export function CompliancePage() {
  const { employees, runs, org, orgId } = useOrg();
  const { dispatch } = useApp();
  const { actor } = useWorkspace();
  const [tab, setTab] = useState("emp201");
  const [reference, setReference] = useState("");
  const [field, setField] = useState<"paye" | "uif" | "sdl" | "coida">("paye");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const monthly = runs.find((run) => run.frequency === "monthly" && run.calculated);
  const people = monthly ? runEmployees(monthly, employees) : [];
  const lines = people.flatMap((employee) => employee.lines);
  const paye = sumCode(lines, "PAYE");
  const uifEmployee = sumCode(lines, "UIF");
  const uifEmployer = sumCode(lines, "UIF-ER");
  const sdl = sumCode(lines, "SDL");
  const octoberPaye = HISTORY.filter((item) => item.periodLabel.startsWith("October") && employees.some((employee) => employee.id === item.employeeId)).reduce((sum, item) => sum + item.paye, 0);

  function saveReference(event: FormEvent) {
    event.preventDefault();
    const digits = reference.replace(/\D/g, "");
    if (digits.length < 2) {
      setError("Enter at least two digits. Only a mask is stored.");
      return;
    }
    dispatch({ type: "set-reference", orgId, field, value: `•••• ${digits.slice(-2)}`, actor });
    setReference("");
    setError("");
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Statutory compliance" description="Worksheets for EMP201, EMP501 and tax certificates. Nothing on this screen is submitted to SARS." />
      <IllustrativeBanner />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "emp201", label: "EMP201" },
          { id: "emp501", label: "EMP501" },
          { id: "certificates", label: "IRP5 and IT3(a)" },
          { id: "registrations", label: "Registrations" },
        ]}
      />
      {tab === "emp201" ? (
        monthly ? (
          <Card>
            <CardTitle title="November EMP201 preparation worksheet" description="Due 7 Dec 2026. Employee UIF and employer UIF are shown on separate rows." />
            <table className="w-full text-sm">
              <thead className="text-left text-xs tracking-wide text-muted uppercase">
                <tr className="border-b border-line">
                  <th className="py-2 font-medium">Line</th>
                  <th className="py-2 font-medium">Where it sits</th>
                  <th className="py-2 text-right font-medium">Sample amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["PAYE", "Employee deduction", paye],
                  ["UIF employee", "Employee deduction", uifEmployee],
                  ["UIF employer", "Employer contribution", uifEmployer],
                  ["SDL", "Employer contribution", sdl],
                ].map(([label, where, amount]) => (
                  <tr key={String(label)} className="border-b border-line">
                    <td className="py-2">{label}</td>
                    <td className="py-2 text-muted">{where}</td>
                    <td className="num py-2 text-right">{formatRand(Number(amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm">UIF sample to pay over, employee plus employer: <span className="num font-semibold">{formatRand(uifEmployee + uifEmployer)}</span></p>
            <p className="mt-1 text-sm">Sample total of the rows above: <span className="num font-semibold">{formatRand(paye + uifEmployee + uifEmployer + sdl)}</span></p>
          </Card>
        ) : (
          <EmptyState title="No EMP201 worksheet yet" body="Open and calculate a monthly run before preparing the worksheet." />
        )
      ) : null}
      {tab === "emp501" ? (
        <Card>
          <CardTitle title="EMP501 reconciliation" description="The 2026/27 reconciliation is not started. The figures below are sample totals already stored on payslips." />
          <DefinitionList
            items={[
              { term: "October PAYE sample", detail: formatRand(octoberPaye) },
              { term: "November PAYE sample", detail: monthly ? formatRand(paye) : "No November run" },
              { term: "Status", detail: "Not started" },
            ]}
          />
          <p className="mt-3 text-sm text-muted">Adding these samples together is not a reconciliation to SARS.</p>
        </Card>
      ) : null}
      {tab === "certificates" ? (
        <Card>
          <CardTitle title="IRP5 and IT3(a)" description="Certificates are not issued from this demonstration. The list shows who would be included." />
          {employees.length === 0 ? (
            <EmptyState title="No employees" body="Certificate preparation starts once people are on the register." />
          ) : (
            <ul className="divide-y divide-line text-sm">
              {employees.map((employee) => (
                <li key={employee.id} className="flex items-center justify-between py-2">
                  <span>{employee.firstName} {employee.lastName}</span>
                  <Badge tone="neutral">{employee.status === "terminated" ? "Final certificate not issued" : "Tax year in progress"}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Button className="mt-4" variant="secondary" onClick={() => setPreview(true)} disabled={employees.length === 0}>
            Preview sample layout
          </Button>
          <ConfirmDialog
            open={preview}
            title="Sample layout only"
            body="This is not an IRP5 or an IT3(a). No certificate number is created and nothing is filed."
            confirmLabel="Note it in the audit history"
            onClose={() => setPreview(false)}
            onConfirm={() => {
              dispatch({ type: "protected-view", employeeName: "the certificate pack", actor, orgId });
              setPreview(false);
            }}
          />
        </Card>
      ) : null}
      {tab === "registrations" ? (
        <Card>
          <CardTitle title="Registrations on file" description="References are masked. MzansiPay does not display a government logo." />
          <DefinitionList
            items={[
              { term: "PAYE", detail: org.paye },
              { term: "UIF", detail: org.uif },
              { term: "SDL", detail: org.sdl },
              { term: "COIDA", detail: org.coida },
              { term: "Company registration", detail: org.registration },
            ]}
          />
          <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={saveReference} noValidate>
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
            <div className="sm:pt-7">
              <Button type="submit">Save mask</Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

export function ReportsPage() {
  const { org } = useOrg();
  const { base } = useWorkspace();
  const reports = [
    ["payroll-summary", "Payroll summary", "Gross, deductions, net salary and employer cost for the open monthly run."],
    ["emp201", "EMP201 worksheet", "Sample PAYE, UIF and SDL rows kept in their own columns."],
    ["departments", "Cost by department", "Employer cost grouped by department."],
    ["leave", "Leave days", "Day balances only. A rand liability is not calculated."],
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Reports" description="Each report is built from the sample lines already on the payroll. Export is a CSV of those lines." />
      <div className="grid gap-3">
        {reports.map(([id, title, body]) => (
          <Card key={id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted">{body}</p>
              </div>
              <ButtonLink to={`${base}/reports/${id}`} variant="secondary">
                Open
              </ButtonLink>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ReportViewPage() {
  const { reportId } = useParams();
  const { employees, runs, org, leave } = useOrg();
  const { base } = useWorkspace();
  const monthly = runs.find((run) => run.frequency === "monthly" && run.calculated);
  const people = monthly ? runEmployees(monthly, employees).filter((employee) => employee.lines.length > 0) : [];
  const lines = people.flatMap((employee) => employee.lines);
  if (!reportId) return <ErrorState title="Report not found" body="Choose a report from the library." />;
  if (!monthly && reportId !== "leave") {
    return (
      <div className="space-y-4">
        <PageHeader title="Report" description="This organisation has no calculated payroll yet." />
        <EmptyState title="Nothing to report" body="Open a payroll run before running payroll reports." action={<ButtonLink to={`${base}/payroll`}>Go to payroll</ButtonLink>} />
      </div>
    );
  }
  const title = reportId === "emp201" ? "EMP201 worksheet" : reportId === "departments" ? "Cost by department" : reportId === "leave" ? "Leave days" : "Payroll summary";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={org.tradingName}
        title={title}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              const rows = [["Item", "Amount"], ...people.map((employee) => [employee.employeeNumber, formatRand(sumLines(employee.lines).net)])];
              downloadText(`${reportId}.csv`, toCsv(rows), "text/csv");
            }}
          >
            Export
          </Button>
        }
      />
      <IllustrativeBanner />
      {reportId === "payroll-summary" ? <PayrollStatement lines={lines} /> : null}
      {reportId === "emp201" ? (
        <Card>
          <DefinitionList
            items={[
              { term: "PAYE sample", detail: formatRand(sumCode(lines, "PAYE")) },
              { term: "UIF employee sample", detail: formatRand(sumCode(lines, "UIF")) },
              { term: "UIF employer sample", detail: formatRand(sumCode(lines, "UIF-ER")) },
              { term: "SDL sample", detail: formatRand(sumCode(lines, "SDL")) },
            ]}
          />
        </Card>
      ) : null}
      {reportId === "departments" ? (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="py-2">Department</th>
                <th className="py-2 text-right">People</th>
                <th className="py-2 text-right">Net salaries</th>
                <th className="py-2 text-right">Employer cost</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment(people).map((row) => (
                <tr key={row.department} className="border-t border-line">
                  <td className="py-2">{row.department}</td>
                  <td className="py-2 text-right">{row.count}</td>
                  <td className="num py-2 text-right">{formatRand(row.totals.net)}</td>
                  <td className="num py-2 text-right">{formatRand(row.totals.employerCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
      {reportId === "leave" ? (
        <Card>
          <CardTitle title="Days on record" description="A rand value for leave liability is not calculated in this demonstration." />
          <ul className="divide-y divide-line text-sm">
            {employees.filter((employee) => employee.status !== "terminated").map((employee) => (
              <li key={employee.id} className="flex justify-between py-2">
                <span>{employee.firstName} {employee.lastName}</span>
                <span className="text-muted">Annual {employee.leave.annual} · Sick {employee.leave.sick} · Family {employee.leave.family}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">{leave.length} requests are in the leave history.</p>
        </Card>
      ) : null}
      <Link className="text-sm font-medium text-blue-700" to={`${base}/reports`}>
        All reports
      </Link>
    </div>
  );
}

export function PaymentsPage() {
  const { payments, runs, org } = useOrg();
  const { dispatch } = useApp();
  const { mode, actor } = useWorkspace();
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const selected = payments.find((payment) => payment.id === releaseId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payments" description="A batch can be released only after the payroll is approved. This demonstration does not send a bank file." />
      {payments.length === 0 ? (
        <EmptyState title="No payment batches" body="A batch is created when a payroll run is opened." />
      ) : (
        payments.map((payment) => {
          const meta = paymentStatusMeta(payment.status);
          const run = runs.find((item) => item.id === payment.runId);
          return (
            <Card key={payment.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <h2 className="mt-2 font-semibold">{payment.name}</h2>
                  <p className="text-sm text-muted">
                    Pay date {formatDate(payment.payDate)} · {payment.employees} employees · {payment.accountName} · {payment.accountMasked}
                  </p>
                  <p className="text-sm text-muted">Reference {payment.reference}</p>
                  {payment.failure ? <p className="mt-2 text-sm text-red-700">{payment.failure}</p> : null}
                  {run && run.status !== "approved" && run.status !== "paid" && payment.status === "blocked" ? (
                    <p className="mt-2 text-sm text-muted">Release stays closed until the payroll is approved.</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Net salaries</p>
                  <p className="num text-xl font-semibold">{formatRand(payment.amount)}</p>
                  <div className="mt-3 flex justify-end gap-2">
                    {payment.status === "failed" ? (
                      <Button
                        variant="secondary"
                        disabled={retrying === payment.id}
                        onClick={() => {
                          setRetrying(payment.id);
                          window.setTimeout(() => {
                            dispatch({ type: "retry-payment", paymentId: payment.id, actor });
                            setRetrying(null);
                          }, 700);
                        }}
                      >
                        {retrying === payment.id ? "Checking file…" : "Retry file"}
                      </Button>
                    ) : null}
                    {payment.status === "ready" ? (
                      <Button disabled={mode === "accountant"} onClick={() => setReleaseId(payment.id)}>
                        {mode === "accountant" ? "Employer releases payment" : "Release batch"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
      <ConfirmDialog
        open={selected !== undefined}
        title="Mark this batch released?"
        requireCheck
        checkLabel="I confirm this only marks the sample batch as released. No money is sent."
        confirmLabel="Mark released"
        onClose={() => setReleaseId(null)}
        onConfirm={() => {
          if (selected) dispatch({ type: "release-payment", paymentId: selected.id, actor });
          setReleaseId(null);
        }}
        body={
          selected ? (
            <p>
              {selected.name} · {formatRand(selected.amount)} · {selected.accountMasked} · {selected.reference}
            </p>
          ) : null
        }
      />
    </div>
  );
}

export function DocumentsPage() {
  const { documents, employees, org, orgId } = useOrg();
  const { dispatch } = useApp();
  const { actor } = useWorkspace();
  const [owner, setOwner] = useState("all");
  const [pending, setPending] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const visible = documents.filter((document) => owner === "all" || document.owner === owner || (owner === "company" && document.owner === "company"));
  const selected = documents.find((document) => document.id === pending);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Documents" description="Restricted files are access-logged. Downloads in this demonstration contain no identity numbers." />
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim().length < 3) {
                setError("Enter a document name.");
                return;
              }
              dispatch({
                type: "add-document",
                actor,
                document: { id: uid("doc"), orgId, owner: "company", name: name.trim(), category: "Uploaded", updated: "2026-11-18", sensitivity: "restricted" },
              });
              setName("");
              setError("");
            }}
          >
            <Field label="Record a file" htmlFor="doc-name" error={error} hint="The name is stored. The file itself is not uploaded.">
              <Input id="doc-name" invalid={Boolean(error)} value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Button type="submit" size="sm">
              Add to library
            </Button>
          </form>
        </Card>
        <div className="space-y-3">
          <Field label="Folder" htmlFor="folder">
            <Select id="folder" value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option value="all">All documents</option>
              <option value="company">Company</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </Select>
          </Field>
          {visible.length === 0 ? (
            <EmptyState title="This folder is empty" body="Choose another folder, or record a company document." />
          ) : (
            visible.map((document) => (
              <Card key={document.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium">{document.name}</h2>
                      <Badge tone={document.sensitivity === "restricted" ? "warning" : "neutral"}>{document.sensitivity === "restricted" ? "Restricted" : "Standard"}</Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {document.category} · Updated {formatDate(document.updated)}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setPending(document.id)}>
                    Prepare download
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(selected)}
        title="Download is access-logged"
        body="The sample file names the document only. It does not include identity, tax or bank numbers."
        confirmLabel="Download sample"
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!selected) return;
          downloadText(`${selected.name}.txt`, `${selected.name}\n${org.legalName}\nRestricted access noted for ${actor}.\nNo personal numbers included.\n`);
          setPending(null);
        }}
      />
    </div>
  );
}

export function SettingsPage() {
  const { org, users, audit, orgId } = useOrg();
  const { state, dispatch } = useApp();
  const { actor, mode } = useWorkspace();
  const [tab, setTab] = useState("organisation");
  const [invite, setInvite] = useState({ name: "", email: "", role: "HR administrator" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<Record<string, string>>({});
  const [passwordOk, setPasswordOk] = useState("");
  const [revoke, setRevoke] = useState(false);
  const [factorOff, setFactorOff] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Organisation settings" description="Company details, roles, security and the audit history." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "organisation", label: "Organisation" },
          { id: "calendar", label: "Pay calendar" },
          { id: "users", label: "Users and roles" },
          { id: "security", label: "Security" },
          { id: "audit", label: "Audit" },
          { id: "accountant", label: "Accountant access" },
        ]}
      />
      {tab === "organisation" ? (
        <Card>
          <DefinitionList
            items={[
              { term: "Trading name", detail: org.tradingName },
              { term: "Registered name", detail: org.legalName },
              { term: "Registration", detail: org.registration },
              { term: "Address", detail: org.address.join(", ") },
              { term: "Payroll email", detail: org.email },
              { term: "Phone", detail: org.phone },
            ]}
          />
        </Card>
      ) : null}
      {tab === "calendar" ? (
        <Card>
          <CardTitle title="Pay calendar" description="Dates are shown as 18 Nov 2026. Numeric dates on payslips use DD/MM/YYYY." />
          <DefinitionList
            items={[
              { term: "Frequencies", detail: org.frequencies.map((item) => item[0].toUpperCase() + item.slice(1)).join(", ") },
              { term: "Monthly pay day", detail: org.payDay },
              { term: "Current period", detail: "1 Nov 2026 – 30 Nov 2026" },
            ]}
          />
        </Card>
      ) : null}
      {tab === "users" ? (
        <div className="space-y-4">
          <Card>
            <ul className="divide-y divide-line text-sm">
              {users.map((user) => (
                <li key={user.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium">{user.name}</span>
                    <span className="block text-muted">{user.email}</span>
                  </span>
                  <Badge tone={user.status === "active" ? "success" : "info"}>{user.role}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const next: Record<string, string> = {};
                if (invite.name.trim().length < 2) next.name = "Enter a name.";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) next.email = "Enter a valid email.";
                setErrors(next);
                if (Object.keys(next).length) return;
                dispatch({ type: "add-user", actor, user: { id: uid("user"), orgId, name: invite.name.trim(), email: invite.email.trim(), role: invite.role, status: "invited" } });
                setInvite({ name: "", email: "", role: "HR administrator" });
              }}
            >
              <CardTitle title="Invite a user" />
              <Field label="Name" htmlFor="user-name" error={errors.name}>
                <Input id="user-name" invalid={Boolean(errors.name)} value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} />
              </Field>
              <Field label="Email" htmlFor="user-email" error={errors.email}>
                <Input id="user-email" invalid={Boolean(errors.email)} value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
              </Field>
              <Field label="Role" htmlFor="user-role">
                <Select id="user-role" value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })}>
                  <option>Payroll administrator</option>
                  <option>HR administrator</option>
                  <option>Reports viewer</option>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit">Send invitation</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
      {tab === "security" ? (
        <div className="space-y-4">
          <Card>
            <CardTitle title="Session" description="This demonstration session is shown as Johannesburg time." />
            <DefinitionList
              items={[
                { term: "Signed in as", detail: actor },
                { term: "Session timeout", detail: "30 minutes of inactivity" },
                { term: "Two-factor authentication", detail: state.twoFactor ? "On" : "Off" },
                { term: "Current session", detail: "This browser · Johannesburg · started 18 Nov 2026, 21:10 SAST" },
              ]}
            />
            <div className="mt-4">
              {state.twoFactor ? (
                <Button variant="danger" onClick={() => setFactorOff(true)}>
                  Turn off two-factor authentication
                </Button>
              ) : (
                <Button onClick={() => dispatch({ type: "set-two-factor", enabled: true, actor })}>Turn on two-factor authentication</Button>
              )}
            </div>
          </Card>
          <Card>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const next: Record<string, string> = {};
                if (!password.current) next.current = "Enter the current password.";
                if (password.next.length < 12 || !/[A-Za-z]/.test(password.next) || !/\d/.test(password.next)) next.next = "Use at least 12 characters with a letter and a number.";
                if (password.next !== password.confirm) next.confirm = "The new passwords do not match.";
                setPasswordError(next);
                setPasswordOk(Object.keys(next).length ? "" : "Validation passed. No password was stored or sent.");
              }}
            >
              <CardTitle title="Password check" description="The form shows how a change is validated. This demonstration does not store a password." />
              <Field label="Current password" htmlFor="current-password" error={passwordError.current}>
                <Input id="current-password" type="password" invalid={Boolean(passwordError.current)} value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} />
              </Field>
              <Field label="New password" htmlFor="new-password" error={passwordError.next}>
                <Input id="new-password" type="password" invalid={Boolean(passwordError.next)} value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} />
              </Field>
              <Field label="Confirm new password" htmlFor="confirm-password" error={passwordError.confirm}>
                <Input id="confirm-password" type="password" invalid={Boolean(passwordError.confirm)} value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} />
              </Field>
              {passwordOk ? <p className="text-sm text-green-800">{passwordOk}</p> : null}
              <Button type="submit">Check password</Button>
            </form>
          </Card>
        </div>
      ) : null}
      {tab === "audit" ? (
        <Card padding={false}>
          <ul className="divide-y divide-line">
            {audit.map((event) => (
              <li key={event.id} className="px-5 py-3 text-sm">
                <p className="font-medium">{event.action}</p>
                <p className="text-muted">{event.detail}</p>
                <p className="text-xs text-muted">{event.actor} · {formatDateTime(event.at)}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {tab === "accountant" ? (
        <Card>
          <CardTitle title="Harbour & Co" description="An accountant sees this organisation only after you authorise access." />
          <p className="text-sm text-muted">{state.accountantAccess[orgId] ? "Access is authorised." : "Access is revoked. Payroll data is hidden from the practice."}</p>
          {mode === "accountant" ? <p className="mt-2 text-sm">You are inside the client file, so you cannot change this authorisation.</p> : null}
          {mode === "employer" ? (
            <div className="mt-4">
              {state.accountantAccess[orgId] ? (
                <Button variant="danger" onClick={() => setRevoke(true)}>
                  Remove access
                </Button>
              ) : (
                <Button onClick={() => dispatch({ type: "restore-access", orgId, actor })}>Authorise Harbour & Co</Button>
              )}
            </div>
          ) : null}
        </Card>
      ) : null}
      <ConfirmDialog
        open={revoke}
        title="Remove Harbour & Co?"
        body="They will no longer open this organisation's payroll, employees or payslips."
        confirmLabel="Remove access"
        tone="danger"
        onClose={() => setRevoke(false)}
        onConfirm={() => {
          dispatch({ type: "revoke-access", orgId, actor });
          setRevoke(false);
        }}
      />
      <ConfirmDialog
        open={factorOff}
        title="Turn off two-factor authentication?"
        body="Payroll data is sensitive. Turning this off lowers the check on this demonstration session."
        confirmLabel="Turn off"
        tone="danger"
        onClose={() => setFactorOff(false)}
        onConfirm={() => {
          dispatch({ type: "set-two-factor", enabled: false, actor });
          setFactorOff(false);
        }}
      />
    </div>
  );
}

export function BillingPage() {
  const { org, orgId } = useOrg();
  const { dispatch } = useApp();
  const { actor } = useWorkspace();
  const [nextPlan, setNextPlan] = useState<string | null>(null);
  const [cancel, setCancel] = useState(false);
  const current = EMPLOYER_PLANS.find((plan) => plan.id === org.planId);
  const upcoming = EMPLOYER_PLANS.find((plan) => plan.id === org.nextPlanId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Subscription and billing" description="MzansiPay is a paid subscription. There is no free plan." />
      <Card>
        <CardTitle title={current ? `${current.name} is active` : "Plan"} description="Renews 1 Dec 2026 unless you schedule a change. Prices include VAT at 15%." />
        {org.cancelOn ? <p className="mb-3 text-sm text-amber-800">The subscription ends on 1 Dec 2026. Payroll access ends with it. There is no free plan after cancellation.</p> : null}
        {upcoming ? <p className="mb-3 text-sm text-ink">{upcoming.name} starts on 1 Dec 2026. {current?.name} continues until then.</p> : null}
        <div className="grid gap-3 lg:grid-cols-3">
          {EMPLOYER_PLANS.map((plan) => (
            <div key={plan.id} className={`rounded-xl border p-4 ${plan.id === org.planId ? "border-blue-600" : "border-line"}`}>
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="num mt-1 text-2xl font-semibold">{formatRand(plan.price)}<span className="text-sm font-normal text-muted"> / month</span></p>
              <p className="text-sm text-muted">{plan.audience}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Button className="mt-4" variant={plan.id === org.planId ? "secondary" : "primary"} disabled={plan.id === org.planId} onClick={() => setNextPlan(plan.id)}>
                {plan.id === org.planId ? "Current plan" : "Schedule change"}
              </Button>
            </div>
          ))}
        </div>
        {!org.cancelOn ? (
          <Button className="mt-4" variant="danger" onClick={() => setCancel(true)}>
            Cancel at period end
          </Button>
        ) : null}
      </Card>
      <Card>
        <CardTitle title="Invoices" />
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="py-2">Invoice</th>
              <th className="py-2">Date</th>
              <th className="py-2 text-right">Ex VAT</th>
              <th className="py-2 text-right">VAT</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {EMPLOYER_INVOICES[orgId].map((invoice) => (
              <tr key={invoice.id} className="border-t border-line">
                <td className="py-2">{invoice.id}</td>
                <td className="py-2">{formatDate(invoice.date)}</td>
                <td className="num py-2 text-right">{formatRand(invoice.exVat)}</td>
                <td className="num py-2 text-right">{formatRand(invoice.vat)}</td>
                <td className="num py-2 text-right">{formatRand(invoice.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ConfirmDialog
        open={nextPlan !== null}
        title="Schedule this plan change?"
        body={`The new plan starts on 1 Dec 2026. ${current?.name ?? "The current plan"} stays in place until then.`}
        confirmLabel="Schedule change"
        onClose={() => setNextPlan(null)}
        onConfirm={() => {
          if (nextPlan) dispatch({ type: "set-next-plan", orgId, planId: nextPlan, actor });
          setNextPlan(null);
        }}
      />
      <ConfirmDialog
        open={cancel}
        title="Cancel at the end of the period?"
        body="Access continues until 1 Dec 2026. After that there is no free plan and payroll processing stops."
        confirmLabel="Cancel subscription"
        tone="danger"
        onClose={() => setCancel(false)}
        onConfirm={() => {
          dispatch({ type: "cancel-org", orgId, actor });
          setCancel(false);
        }}
      />
    </div>
  );
}
