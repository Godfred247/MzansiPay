import { useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Check, Home, Menu, Users, Wallet } from "lucide-react";
import { fullName, payslipCatalogue, runEmployees, runStatusMeta, runTotals, sumLines } from "../domain.ts";
import { DEMO_DATE_LONG, formatDate, formatRand } from "../format.ts";
import { IllustrativeBanner } from "../finance.tsx";
import { HISTORY } from "../sample.ts";
import { useApp, useOrg } from "../state.tsx";
import { EMPLOYER_USER } from "../workspace.ts";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Field, Input, Textarea, Toasts, cn } from "../ui.tsx";

export function Phone({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#E6EDF5] md:flex md:flex-col md:items-center md:justify-center md:px-6 md:py-6">
      <p className="mb-3 hidden text-center text-sm text-muted md:block">{caption}</p>
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-canvas md:h-[min(900px,calc(100dvh-72px))] md:rounded-[28px] md:border md:border-slate-300 md:shadow-[0_20px_50px_rgba(20,33,61,0.18)]">
        {children}
      </div>
      <Toasts />
    </div>
  );
}

export function TabBar({ items, active }: { items: { id: string; to: string; label: string; icon: typeof Home; badge?: number }[]; active: string }) {
  return (
    <nav className="grid shrink-0 grid-cols-5 border-t border-line bg-white pb-[max(8px,env(safe-area-inset-bottom))]" aria-label="Mobile">
      {items.map((item) => (
        <NavLink key={item.id} to={item.to} className="relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium">
          <item.icon className={cn("h-5 w-5", active === item.id ? "text-blue-700" : "text-slate-500")} />
          <span className={active === item.id ? "text-blue-700" : "text-slate-500"}>{item.label}</span>
          {item.badge ? <span className="absolute top-2 right-5 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] text-white">{item.badge}</span> : null}
        </NavLink>
      ))}
    </nav>
  );
}

function employerSection(pathname: string) {
  if (pathname.startsWith("/m/employees")) return "employees";
  if (pathname.startsWith("/m/payroll")) return "payroll";
  if (pathname.startsWith("/m/approvals")) return "approvals";
  if (pathname === "/m") return "home";
  return "more";
}

export function EmployerMobileLayout() {
  const { pathname } = useLocation();
  const { leave, runs } = useOrg();
  const approvals = leave.filter((request) => request.status === "pending").length + (runs.some((run) => run.status === "in_review") ? 1 : 0);
  return (
    <Phone caption={`Employer mobile · ${EMPLOYER_USER.name} · Khanyisa Retail or Moloto Studio`}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TabBar
        active={employerSection(pathname)}
        items={[
          { id: "home", to: "/m", label: "Home", icon: Home },
          { id: "employees", to: "/m/employees", label: "Employees", icon: Users },
          { id: "payroll", to: "/m/payroll", label: "Payroll", icon: Wallet },
          { id: "approvals", to: "/m/approvals", label: "Approvals", icon: Check, badge: approvals },
          { id: "more", to: "/m/more", label: "More", icon: Menu },
        ]}
      />
    </Phone>
  );
}

export function EmployerHome() {
  const { org, runs, employees, leave } = useOrg();
  const monthly = runs.find((run) => run.frequency === "monthly");
  const people = monthly ? runEmployees(monthly, employees) : [];
  const totals = monthly ? runTotals(monthly, employees) : null;
  const pending = leave.filter((request) => request.status === "pending");
  return (
    <div>
      <header className="bg-navy px-5 pt-8 pb-16 text-white">
        <p className="text-sm text-white/70">{org.tradingName}</p>
        <h1 className="mt-1 text-2xl font-semibold">Good evening, Amara</h1>
        <p className="text-sm text-white/70">{DEMO_DATE_LONG}</p>
      </header>
      <div className="-mt-10 space-y-3 px-4 pb-6">
        {monthly && totals ? (
          <section className="rounded-2xl border border-line bg-white p-4">
            <Badge tone={runStatusMeta(monthly.status).tone}>{runStatusMeta(monthly.status).label}</Badge>
            <h2 className="mt-2 font-semibold">{monthly.name}</h2>
            <p className="text-sm text-muted">Pay date {formatDate(monthly.payDate)} · {people.length} employees</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted">Net salaries</p>
                <p className="num text-lg font-semibold text-teal-700">{monthly.calculated ? formatRand(totals.net) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Employer cost</p>
                <p className="num text-lg font-semibold">{monthly.calculated ? formatRand(totals.employerCost) : "—"}</p>
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">Employer cost includes contributions and is not taken off net salary.</p>
            <Link to={`/m/payroll/${monthly.id}`} className="mt-4 flex h-11 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white">
              Review payroll
            </Link>
          </section>
        ) : (
          <EmptyState title="No payroll is open" body="Add people from Employees, then open a run on the web workspace or from Payroll." />
        )}
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">Waiting on you</h2>
          <p className="mt-1 text-sm text-muted">{pending.length} leave request{pending.length === 1 ? "" : "s"}</p>
          <Link to="/m/approvals" className="mt-3 inline-flex text-sm font-medium text-blue-700">Open approvals</Link>
        </section>
      </div>
    </div>
  );
}

export function EmployerEmployees() {
  const { employees } = useOrg();
  const [query, setQuery] = useState("");
  const visible = employees.filter((employee) => fullName(employee).toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-semibold">Employees</h1>
      <Input className="mt-3" aria-label="Search employees" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
      {employees.length === 0 ? <div className="mt-4"><EmptyState title="No employees" body="This organisation has nobody on the register yet." /></div> : null}
      {employees.length > 0 && visible.length === 0 ? <p className="mt-4 text-sm text-muted">No employees match.</p> : null}
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
        {visible.map((employee) => (
          <li key={employee.id}>
            <Link to={`/m/employees/${employee.id}`} className="flex items-center justify-between px-4 py-3">
              <span>
                <span className="block text-sm font-medium">{fullName(employee)}</span>
                <span className="block text-xs text-muted">{employee.jobTitle}</span>
              </span>
              <span className="num text-sm">{employee.lines.length ? formatRand(sumLines(employee.lines).net) : "—"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployerEmployeeDetail() {
  const { employeeId } = useParams();
  const { employees } = useOrg();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return <div className="p-4"><ErrorState title="Not on this organisation" body="Switch organisation from More if you expected to see this person." /></div>;
  const totals = sumLines(employee.lines);
  return (
    <div className="px-4 py-5">
      <Link to="/m/employees" className="text-sm font-medium text-blue-700">Employees</Link>
      <h1 className="mt-2 text-xl font-semibold">{fullName(employee)}</h1>
      <p className="text-sm text-muted">{employee.jobTitle} · {employee.site}</p>
      <div className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <Row label="Net salary" value={formatRand(totals.net)} emphasis />
        <Row label="Employee deductions" value={formatRand(totals.employeeDeductions)} />
        <Row label="Employer contributions" value={formatRand(totals.employerContributions)} />
        <Row label="Bank" value={`${employee.bank} ${employee.accountMasked}`} />
        <Row label="Identity number" value={employee.idMasked} />
      </div>
    </div>
  );
}

function Row({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={cn("num text-right", emphasis && "font-semibold text-teal-700")}>{value}</span>
    </div>
  );
}

export function EmployerPayroll() {
  const { runs, employees } = useOrg();
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-semibold">Payroll</h1>
      {runs.length === 0 ? <div className="mt-4"><EmptyState title="No runs" body="Open November payroll from the employer web workspace after adding employees." /></div> : null}
      <div className="mt-3 space-y-3">
        {runs.map((run) => {
          const totals = runTotals(run, employees);
          return (
            <Link key={run.id} to={`/m/payroll/${run.id}`} className="block rounded-2xl border border-line bg-white p-4">
              <Badge tone={runStatusMeta(run.status).tone}>{runStatusMeta(run.status).label}</Badge>
              <p className="mt-2 font-medium">{run.name}</p>
              <p className="num text-sm text-teal-700">{run.calculated ? formatRand(totals.net) : "Not calculated"}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function EmployerRun() {
  const { runId } = useParams();
  const { runs, employees } = useOrg();
  const { dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const run = runs.find((item) => item.id === runId);
  if (!run) return <div className="p-4"><ErrorState title="Run not found" body="It may belong to the other organisation." /></div>;
  const totals = runTotals(run, employees);
  return (
    <div className="space-y-3 px-4 py-5">
      <Link to="/m/payroll" className="text-sm font-medium text-blue-700">Payroll</Link>
      <h1 className="text-xl font-semibold">{run.name}</h1>
      <Badge tone={runStatusMeta(run.status).tone}>{runStatusMeta(run.status).label}</Badge>
      {run.calculated ? (
        <>
          <IllustrativeBanner />
          <div className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
            <Row label="Gross earnings" value={formatRand(totals.gross)} />
            <Row label="Employee deductions" value={formatRand(totals.employeeDeductions)} />
            <Row label="Net salaries" value={formatRand(totals.net)} emphasis />
            <Row label="Employer contributions" value={formatRand(totals.employerContributions)} />
            <Row label="Employer cost" value={formatRand(totals.employerCost)} emphasis />
          </div>
        </>
      ) : (
        <Button onClick={() => dispatch({ type: "calculate-run", runId: run.id, actor: EMPLOYER_USER.name })}>Use sample lines</Button>
      )}
      {run.status === "in_review" ? <Button onClick={() => setOpen(true)}>Approve payroll</Button> : null}
      {run.status === "draft" ? <Button onClick={() => dispatch({ type: "submit-run", runId: run.id, actor: EMPLOYER_USER.name })}>Submit for review</Button> : null}
      <ConfirmDialog
        open={open}
        align="bottom"
        title="Approve this payroll?"
        requireCheck
        checkLabel="I approve the sample totals. They are not a statutory determination."
        confirmLabel="Approve"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          dispatch({ type: "approve-run", runId: run.id, actor: EMPLOYER_USER.name });
          setOpen(false);
        }}
        body={<p>Net salaries {formatRand(totals.net)}. Employer cost {formatRand(totals.employerCost)}.</p>}
      />
    </div>
  );
}

export function EmployerApprovals() {
  const { leave, employees, runs } = useOrg();
  const { dispatch } = useApp();
  const [leaveId, setLeaveId] = useState<string | null>(null);
  const [decline, setDecline] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const pending = leave.filter((request) => request.status === "pending");
  const payroll = runs.filter((run) => run.status === "in_review");
  return (
    <div className="space-y-4 px-4 py-5">
      <h1 className="text-xl font-semibold">Approvals</h1>
      {payroll.length === 0 && pending.length === 0 ? <EmptyState title="You are up to date" body="Payroll and leave approvals will show here." /> : null}
      {payroll.map((run) => (
        <Link key={run.id} to={`/m/payroll/${run.id}`} className="block rounded-2xl border border-line bg-white p-4">
          <p className="text-xs text-muted">Payroll</p>
          <p className="font-medium">{run.name}</p>
        </Link>
      ))}
      {pending.map((request) => {
        const person = employees.find((employee) => employee.id === request.employeeId);
        return (
          <div key={request.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-medium">{person ? fullName(person) : "Employee"}</p>
            <p className="text-sm text-muted">{request.type} · {formatDate(request.start)} · {request.days} days</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => { setLeaveId(request.id); setDecline(false); setError(""); }}>Approve</Button>
              <Button variant="danger" onClick={() => { setLeaveId(request.id); setDecline(true); setError(""); }}>Decline</Button>
            </div>
          </div>
        );
      })}
      <ConfirmDialog
        open={leaveId !== null}
        align="bottom"
        title={decline ? "Decline leave?" : "Approve leave?"}
        tone={decline ? "danger" : "primary"}
        confirmLabel={decline ? "Decline" : "Approve"}
        onClose={() => setLeaveId(null)}
        onConfirm={() => {
          if (!leaveId) return;
          if (decline && note.trim().length < 3) {
            setError("Enter a reason.");
            return;
          }
          dispatch({ type: "decide-leave", id: leaveId, decision: decline ? "declined" : "approved", note: note.trim() || "Approved on mobile.", actor: EMPLOYER_USER.name });
          setLeaveId(null);
          setNote("");
        }}
        body={
          <Field label="Note" htmlFor="mobile-leave-note" error={error}>
            <Textarea id="mobile-leave-note" invalid={Boolean(error)} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        }
      />
    </div>
  );
}

export function EmployerMore() {
  const { org } = useOrg();
  const { state, dispatch } = useApp();
  const links = [
    ["/m/payslips", "Payslips"],
    ["/m/leave", "Leave"],
    ["/m/compliance", "Statutory compliance"],
    ["/m/payments", "Payments"],
    ["/m/documents", "Documents"],
    ["/m/reports", "Reports"],
    ["/m/settings", "Settings"],
    ["/m/billing", "Subscription and billing"],
  ];
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-semibold">More</h1>
      <p className="mt-1 text-sm text-muted">{org.tradingName}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(state.orgs) as Array<keyof typeof state.orgs>).map((id) => (
          <button key={id} type="button" className={cn("rounded-xl border px-3 py-3 text-left text-sm", state.orgId === id ? "border-blue-600 bg-blue-50" : "border-line bg-white")} onClick={() => dispatch({ type: "set-org", orgId: id })}>
            {state.orgs[id].tradingName}
          </button>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="block px-4 py-3 text-sm font-medium">{label}</Link>
          </li>
        ))}
        <li>
          <Link to="/" className="block px-4 py-3 text-sm font-medium text-muted">Sign out</Link>
        </li>
      </ul>
    </div>
  );
}

export function EmployerSimple({ title, body, action }: { title: string; body: string; action?: { to: string; label: string } }) {
  return (
    <div className="space-y-3 px-4 py-5">
      <Link to="/m/more" className="text-sm font-medium text-blue-700">More</Link>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm leading-6 text-muted">{body}</p>
      <IllustrativeBanner />
      {action ? <Link to={action.to} className="inline-flex text-sm font-medium text-blue-700">{action.label}</Link> : null}
    </div>
  );
}

export function MobilePayslips() {
  const { runs, org } = useOrg();
  const { state } = useApp();
  const slips = payslipCatalogue(state.employees, runs, HISTORY).filter((slip) => slip.employee.orgId === org.id).slice(0, 8);
  return (
    <div className="px-4 py-5">
      <Link to="/m/more" className="text-sm font-medium text-blue-700">More</Link>
      <h1 className="mt-2 text-xl font-semibold">Payslips</h1>
      {slips.length === 0 ? <div className="mt-4"><EmptyState title="No payslips" body="Calculate a run before payslips appear." /></div> : null}
      <ul className="mt-3 space-y-2">
        {slips.map((slip) => (
          <li key={slip.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <p className="font-medium">{fullName(slip.employee)}</p>
            <p className="text-muted">{slip.periodLabel}</p>
            <p className="num text-teal-700">{formatRand(sumLines(slip.lines).net)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileLeaveList() {
  const { leave, employees } = useOrg();
  return (
    <div className="px-4 py-5">
      <Link to="/m/more" className="text-sm font-medium text-blue-700">More</Link>
      <h1 className="mt-2 text-xl font-semibold">Leave</h1>
      {leave.length === 0 ? <div className="mt-4"><EmptyState title="No leave requests" body="Requests from employees will list here." /></div> : null}
      <ul className="mt-3 space-y-2">
        {leave.map((request) => (
          <li key={request.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <p className="font-medium">{fullName(employees.find((employee) => employee.id === request.employeeId) ?? { firstName: "Employee", lastName: "" })}</p>
            <p className="text-muted">{request.type} · {request.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileMoneyList({ kind }: { kind: "payments" | "compliance" | "billing" | "documents" | "reports" | "settings" }) {
  const { payments, org, documents } = useOrg();
  const { state } = useApp();
  const title = { payments: "Payments", compliance: "Statutory compliance", billing: "Subscription and billing", documents: "Documents", reports: "Reports", settings: "Settings" }[kind];
  return (
    <div className="space-y-3 px-4 py-5">
      <Link to="/m/more" className="text-sm font-medium text-blue-700">More</Link>
      <h1 className="text-xl font-semibold">{title}</h1>
      <IllustrativeBanner />
      {kind === "payments" ? (
        payments.length === 0 ? <EmptyState title="No batches" body="Payment batches appear with a payroll run." /> : payments.map((payment) => (
          <div key={payment.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <p className="font-medium">{payment.name}</p>
            <p className="num">{formatRand(payment.amount)}</p>
            <p className="text-muted">{payment.status} · {payment.accountMasked}</p>
          </div>
        ))
      ) : null}
      {kind === "compliance" ? <p className="text-sm text-muted">EMP201 diary date 7 Dec 2026. PAYE reference {org.paye}. This phone view is a reminder, not a submission.</p> : null}
      {kind === "billing" ? <p className="text-sm text-muted">{org.tradingName} is on a paid plan. There is no free plan. Manage the subscription on the web workspace for invoices and plan changes.</p> : null}
      {kind === "documents" ? documents.slice(0, 5).map((document) => <div key={document.id} className="rounded-2xl border border-line bg-white p-4 text-sm"><p className="font-medium">{document.name}</p><p className="text-muted">{document.sensitivity === "restricted" ? "Restricted" : "Standard"}</p></div>) : null}
      {kind === "reports" ? <p className="text-sm text-muted">Payroll summary, EMP201 worksheet, department cost and leave days are available on the web workspace.</p> : null}
      {kind === "settings" ? <p className="text-sm text-muted">Signed in as {EMPLOYER_USER.name}. Two-factor authentication is {state.twoFactor ? "on" : "off"}. Bank and identity numbers stay masked.</p> : null}
    </div>
  );
}

