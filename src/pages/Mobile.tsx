import { useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { Check, FileText, Home, Menu, UserRound, Users, Wallet } from "lucide-react";
import type { LeaveType } from "../domain.ts";
import { fullName, leaveTone, payslipCatalogue, runEmployees, runStatusMeta, runTotals, sumLines } from "../domain.ts";
import { DEMO_DATE_LONG, formatDate, formatRand, inclusiveDays, uid } from "../format.ts";
import { IllustrativeBanner, PayslipPaper } from "../finance.tsx";
import { HISTORY } from "../sample.ts";
import { useApp, useOrg } from "../state.tsx";
import { EMPLOYEE_USER, EMPLOYER_USER } from "../workspace.ts";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Field, Input, Select, Textarea, Toasts, cn } from "../ui.tsx";

function Phone({ caption, children }: { caption: string; children: ReactNode }) {
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

function TabBar({ items, active }: { items: { id: string; to: string; label: string; icon: typeof Home; badge?: number }[]; active: string }) {
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

function employeeSection(pathname: string) {
  if (pathname.startsWith("/me/payslips")) return "payslips";
  if (pathname.startsWith("/me/leave")) return "leave";
  if (pathname.startsWith("/me/documents")) return "documents";
  if (pathname.startsWith("/me/profile")) return "profile";
  return "home";
}

export function EmployeeMobileLayout() {
  const { pathname } = useLocation();
  return (
    <Phone caption={`Employee mobile · ${EMPLOYEE_USER.name} · own record only`}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TabBar
        active={employeeSection(pathname)}
        items={[
          { id: "home", to: "/me", label: "Home", icon: Home },
          { id: "payslips", to: "/me/payslips", label: "Payslips", icon: FileText },
          { id: "leave", to: "/me/leave", label: "Leave", icon: Check },
          { id: "documents", to: "/me/documents", label: "Documents", icon: Wallet },
          { id: "profile", to: "/me/profile", label: "Profile", icon: UserRound },
        ]}
      />
    </Phone>
  );
}

function useSelf() {
  const { state } = useApp();
  const employee = state.employees.find((item) => item.id === EMPLOYEE_USER.employeeId);
  const slips = payslipCatalogue(state.employees, state.runs, HISTORY).filter((slip) => slip.employee.id === EMPLOYEE_USER.employeeId);
  const requests = state.leave.filter((request) => request.employeeId === EMPLOYEE_USER.employeeId);
  return { employee, slips, requests, state };
}

export function EmployeeHome() {
  const { employee, slips } = useSelf();
  const current = slips.find((slip) => slip.periodLabel.includes("November"));
  if (!employee || !current) return <div className="p-4"><ErrorState title="Record unavailable" body="Your employee record could not be loaded." /></div>;
  const net = sumLines(current.lines).net;
  return (
    <div>
      <header className="bg-navy px-5 pt-8 pb-16 text-white">
        <p className="text-sm text-white/70">Khanyisa Retail</p>
        <h1 className="mt-1 text-2xl font-semibold">Good evening, Thandiwe</h1>
        <p className="text-sm text-white/70">{DEMO_DATE_LONG}</p>
      </header>
      <div className="-mt-10 space-y-3 px-4 pb-6">
        <section className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs text-muted">Next payday · {formatDate(current.payDate)}</p>
          <p className="mt-1 text-sm text-muted">November net salary · {current.final ? "Paid" : "In review, not final"}</p>
          <p className="num mt-2 text-3xl font-semibold text-teal-700">{formatRand(net)}</p>
          <p className="mt-2 text-xs leading-5 text-muted">Illustrative. Employer contributions are not deducted from this amount.</p>
          <Link to={`/me/payslips/${current.id}`} className="mt-4 flex h-11 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white">View payslip</Link>
        </section>
        <section className="rounded-2xl border border-line bg-white p-4 text-sm">
          <h2 className="font-semibold">Leave still on record</h2>
          <div className="mt-2 space-y-1">
            <Row label="Annual" value={`${employee.leave.annual} days`} />
            <Row label="Sick" value={`${employee.leave.sick} days`} />
            <Row label="Family responsibility" value={`${employee.leave.family} days`} />
          </div>
        </section>
      </div>
    </div>
  );
}

export function EmployeePayslips() {
  const { slips } = useSelf();
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-semibold">Payslips</h1>
      <p className="mt-1 text-sm text-muted">Only your payslips are listed.</p>
      <ul className="mt-3 space-y-2">
        {slips.map((slip) => (
          <li key={slip.id}>
            <Link to={`/me/payslips/${slip.id}`} className="block rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{slip.periodLabel}</span>
                <Badge tone={slip.final ? "success" : "warning"}>{slip.final ? "Paid" : "Not final"}</Badge>
              </div>
              <p className="num mt-2 text-lg font-semibold text-teal-700">{formatRand(sumLines(slip.lines).net)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployeePayslip() {
  const { payslipId } = useParams();
  const { slips } = useSelf();
  const { state } = useApp();
  const slip = slips.find((item) => item.id === payslipId);
  if (!slip) return <div className="p-4"><ErrorState title="This payslip is not yours" body="You can only open payslips on your own record." /></div>;
  const org = state.orgs.khanyisa;
  return (
    <div className="px-3 py-4">
      <Link to="/me/payslips" className="text-sm font-medium text-blue-700">Payslips</Link>
      <div className="mt-3">
        <PayslipPaper slip={slip} companyName={org.legalName} companyMeta={org.address.join(", ")} />
      </div>
    </div>
  );
}

export function EmployeeLeave() {
  const { employee, requests } = useSelf();
  const { dispatch } = useApp();
  const [form, setForm] = useState({ type: "Annual" as LeaveType, start: "", end: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState("");
  if (!employee) return null;
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.start || !form.end) next.dates = "Enter a start and end date.";
    const days = form.start && form.end ? inclusiveDays(form.start, form.end) : 0;
    if (days <= 0) next.dates = "The end date must be on or after the start date.";
    if (form.type === "Annual" && days > employee!.leave.annual) next.dates = `This is longer than the annual balance on record (${employee!.leave.annual} days).`;
    if (form.type === "Family responsibility" && days > employee!.leave.family) next.dates = `This is longer than the family responsibility balance on record (${employee!.leave.family} days).`;
    if (form.type === "Sick" && form.note.trim().length < 3) next.note = "Add a short note for sick leave.";
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch({
      type: "add-leave",
      actor: EMPLOYEE_USER.name,
      request: {
        id: uid("leave"),
        orgId: "khanyisa",
        employeeId: employee!.id,
        type: form.type,
        start: form.start,
        end: form.end,
        days,
        status: "pending",
        note: form.note.trim() || "Requested from the employee app.",
      },
    });
    setDone(`${form.type} leave for ${days} calendar days is with Amara Dube and Helen Okonkwo.`);
    setForm({ type: "Annual", start: "", end: "", note: "" });
  }
  if (done) {
    return (
      <div className="space-y-3 px-4 py-5">
        <h1 className="text-xl font-semibold">Request sent</h1>
        <p className="text-sm leading-6 text-muted">{done}</p>
        <Button onClick={() => setDone("")}>Request another</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4 px-4 py-5">
      <h1 className="text-xl font-semibold">Leave</h1>
      <form className="space-y-3 rounded-2xl border border-line bg-white p-4" onSubmit={submit} noValidate>
        <Field label="Type" htmlFor="leave-type">
          <Select id="leave-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as LeaveType })}>
            <option>Annual</option>
            <option>Sick</option>
            <option>Family responsibility</option>
            <option>Maternity</option>
          </Select>
        </Field>
        <Field label="From" htmlFor="leave-from" error={errors.dates}>
          <Input id="leave-from" type="date" invalid={Boolean(errors.dates)} value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
        </Field>
        <Field label="To" htmlFor="leave-to">
          <Input id="leave-to" type="date" invalid={Boolean(errors.dates)} value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
        </Field>
        <Field label="Note" htmlFor="leave-note" error={errors.note} hint="Calendar days. Public holidays are not deducted in this demonstration.">
          <Textarea id="leave-note" invalid={Boolean(errors.note)} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>
        <Button type="submit" className="w-full">Submit request</Button>
      </form>
      <ul className="space-y-2">
        {requests.map((request) => (
          <li key={request.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{request.type}</span>
              <Badge tone={leaveTone(request.status)}>{request.status}</Badge>
            </div>
            <p className="text-muted">{formatDate(request.start)} – {formatDate(request.end)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployeeDocuments() {
  const { state } = useApp();
  const docs = state.documents.filter((document) => document.owner === EMPLOYEE_USER.employeeId);
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-semibold">Documents</h1>
      <p className="mt-1 text-sm text-muted">Files on your record. Company documents are not shown here.</p>
      {docs.length === 0 ? <div className="mt-4"><EmptyState title="No documents" body="Your contracts and proofs of account will appear here." /></div> : null}
      <ul className="mt-3 space-y-2">
        {docs.map((document) => (
          <li key={document.id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-medium">{document.name}</p>
            <p className="text-xs text-muted">{document.category} · Restricted</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployeeProfile() {
  const { employee } = useSelf();
  if (!employee) return null;
  return (
    <div className="space-y-3 px-4 py-5">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="text-sm text-muted">You only see your own record.</p>
      <div className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <Row label="Employee number" value={employee.employeeNumber} />
        <Row label="Role" value={employee.jobTitle} />
        <Row label="Email" value={employee.email} />
        <Row label="Mobile" value={employee.mobile} />
        <Row label="Identity number" value={employee.idMasked} />
        <Row label="Tax reference" value={employee.taxMasked} />
        <Row label="Bank" value={`${employee.bank} ${employee.accountMasked}`} />
      </div>
      <Link to="/" className="inline-flex text-sm font-medium text-blue-700">Sign out</Link>
    </div>
  );
}
