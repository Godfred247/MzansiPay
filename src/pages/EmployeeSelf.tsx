import { useState, type FormEvent } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { Bell, CalendarDays, FileText, Home, UserRound, Wallet } from "lucide-react";
import type { LeaveType } from "../domain.ts";
import { fullName, leaveTone, linesOf, payslipCatalogue, sumLines } from "../domain.ts";
import { decideProfileRequest, markNoticesRead, respondCorrection, submitCorrection, submitProfileRequest, useEmployeeDesk, type ProfileField } from "../employeeDesk.ts";
import { downloadText, formatDate, formatRand, inclusiveDays, uid } from "../format.ts";
import { IllustrativeBanner, PayslipPaper } from "../finance.tsx";
import { HISTORY } from "../sample.ts";
import { Phone, TabBar } from "./Mobile.tsx";
import { useApp } from "../state.tsx";
import { EMPLOYEE_USER } from "../workspace.ts";
import { Badge, Button, Card, CardTitle, EmptyState, ErrorState, Field, Input, PageHeader, Select, Textarea } from "../ui.tsx";
import { MonthGrid } from "../visuals.tsx";

function section(pathname: string) {
  if (pathname.startsWith("/me/payslips")) return "payslips";
  if (pathname.startsWith("/me/leave")) return "leave";
  if (pathname.startsWith("/me/tax")) return "tax";
  if (pathname.startsWith("/me/profile") || pathname.startsWith("/me/corrections")) return "profile";
  return "home";
}

export function EmployeeMobileLayout() {
  const { pathname } = useLocation();
  const desk = useEmployeeDesk();
  const unread = desk.notices.filter((notice) => notice.unread).length;
  return (
    <Phone caption={`Employee mobile · ${EMPLOYEE_USER.name} · own record only`}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <TabBar
        active={section(pathname)}
        items={[
          { id: "home", to: "/me", label: "Home", icon: Home, badge: unread },
          { id: "payslips", to: "/me/payslips", label: "Payslips", icon: Wallet },
          { id: "leave", to: "/me/leave", label: "Leave", icon: CalendarDays },
          { id: "tax", to: "/me/tax", label: "Tax", icon: FileText },
          { id: "profile", to: "/me/profile", label: "Profile", icon: UserRound },
        ]}
      />
    </Phone>
  );
}

function useSelf() {
  const { state, dispatch } = useApp();
  const employee = state.employees.find((item) => item.id === EMPLOYEE_USER.employeeId);
  const slips = payslipCatalogue(state.employees, state.runs, HISTORY).filter((slip) => slip.employee.id === EMPLOYEE_USER.employeeId);
  const requests = state.leave.filter((request) => request.employeeId === EMPLOYEE_USER.employeeId);
  const org = state.orgs.khanyisa;
  return { employee, slips, requests, org, dispatch, state };
}

function Screen({ title, lede, action }: { title: string; lede?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {lede ? <p className="mt-1 text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmployeeHome() {
  const { employee, slips, requests } = useSelf();
  const desk = useEmployeeDesk();
  const latest = slips[0];
  if (!employee || !latest) return <div className="p-4"><ErrorState title="Record unavailable" body="Your employee record could not be loaded." /></div>;
  const net = sumLines(latest.lines).net;
  const pending = requests.filter((request) => request.status === "pending");
  const unread = desk.notices.filter((notice) => notice.unread);
  return (
    <div>
      <header className="bg-navy px-5 pt-8 pb-16 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/70">Khanyisa Retail</p>
            <h1 className="mt-1 text-2xl font-semibold">Good evening, {employee.firstName}</h1>
            <p className="text-sm text-white/70">{employee.jobTitle}</p>
          </div>
          <Link to="/me/notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications"}>
            <Bell className="h-4 w-4" />
            {unread.length ? <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-400" /> : null}
          </Link>
        </div>
      </header>
      <div className="-mt-10 space-y-3 px-4 pb-6">
        <section className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Latest payslip</p>
          <p className="mt-2 text-sm text-muted">{latest.periodLabel}</p>
          <p className="num mt-1 text-3xl font-semibold text-teal-700">{formatRand(net)}</p>
          <p className="mt-1 text-sm">Net salary · {latest.final ? "Paid" : "In review, not final"}</p>
          <p className="mt-2 text-sm text-muted">Pay period {formatDate(latest.start)} – {formatDate(latest.end)}</p>
          <p className="text-sm text-muted">Next expected pay date {formatDate(latest.payDate)}</p>
          <Link to={`/me/payslips/${latest.id}`} className="mt-4 flex h-11 items-center justify-center rounded-lg bg-navy text-sm font-medium text-white">View payslip</Link>
        </section>
        <section className="grid grid-cols-3 gap-2">
          {[
            ["Annual", employee.leave.annual],
            ["Sick", employee.leave.sick],
            ["Family", employee.leave.family],
          ].map(([label, days]) => (
            <Link key={String(label)} to="/me/leave" className="rounded-2xl border border-line bg-white p-3">
              <p className="num text-xl font-semibold">{days}</p>
              <p className="text-xs text-muted">{label}</p>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl border border-line bg-white p-4 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Leave requests</h2>
            <Badge tone={pending.length ? "warning" : "success"}>{pending.length} pending</Badge>
          </div>
          <p className="mt-1 text-muted">{requests.filter((request) => request.status === "approved").length} approved · {requests.filter((request) => request.status === "declined").length} declined</p>
        </section>
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="font-semibold">Recent notifications</h2>
          <ul className="mt-2 divide-y divide-line text-sm">
            {desk.notices.slice(0, 3).map((notice) => (
              <li key={notice.id} className="py-2">
                <Link to={notice.href} className="font-medium text-blue-700">{notice.title}</Link>
                <p className="text-muted">{notice.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="grid grid-cols-2 gap-2">
          {[
            ["Request leave", "/me/leave/request"],
            ["Tax documents", "/me/tax"],
            ["Ask for a correction", "/me/corrections/new"],
            ["Update profile", "/me/profile/edit"],
          ].map(([label, href]) => (
            <Link key={href} to={href} className="rounded-2xl border border-line bg-white px-3 py-3 text-sm font-medium">{label}</Link>
          ))}
        </section>
      </div>
    </div>
  );
}

export function EmployeeNotifications() {
  const desk = useEmployeeDesk();
  return (
    <div className="space-y-3 px-4 py-5">
      <Screen title="Notifications" lede="Payslips, leave, corrections and announcements for your record." action={<Button size="sm" variant="secondary" onClick={markNoticesRead}>Mark read</Button>} />
      <ul className="space-y-2">
        {desk.notices.map((notice) => (
          <li key={notice.id}>
            <Link to={notice.href} className="block rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{notice.title}</span>
                {notice.unread ? <Badge tone="info">New</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted">{notice.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployeePayslips() {
  const { slips } = useSelf();
  return (
    <div className="space-y-3 px-4 py-5">
      <Screen title="Payslips" lede="Only your payslips are listed. A payslip in review can still be opened." />
      {slips.length === 0 ? <EmptyState title="No payslips yet" body="A payslip appears after a run that includes you has been calculated." /> : (
        <ul className="space-y-2">
          {slips.map((slip) => (
            <li key={slip.id}>
              <Link to={`/me/payslips/${slip.id}`} className="block rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{slip.periodLabel}</span>
                  <Badge tone={slip.final ? "success" : "warning"}>{slip.final ? "Paid" : "Not final"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{formatDate(slip.start)} – {formatDate(slip.end)} · Pay {formatDate(slip.payDate)}</p>
                <p className="num mt-2 text-lg font-semibold text-teal-700">{formatRand(sumLines(slip.lines).net)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EmployeePayslip() {
  const { payslipId = "" } = useParams();
  const { slips } = useSelf();
  const slip = slips.find((item) => item.id === payslipId);
  if (!slip) return <div className="p-4"><ErrorState title="This payslip is not yours" body="You can only open payslips on your own record." /></div>;
  const totals = sumLines(slip.lines);
  const groups = [
    ["Earnings", linesOf(slip.lines, "earning"), totals.gross],
    ["Employee deductions", linesOf(slip.lines, "employee_deduction"), totals.employeeDeductions],
    ["Employer contributions", linesOf(slip.lines, "employer_contribution"), totals.employerContributions],
  ] as const;
  return (
    <div className="space-y-3 px-4 py-5">
      <Link to="/me/payslips" className="text-sm font-medium text-blue-700">All payslips</Link>
      <section className="rounded-2xl bg-navy p-4 text-white">
        <p className="text-sm text-white/70">{slip.periodLabel}</p>
        <p className="num mt-1 text-3xl font-semibold">{formatRand(totals.net)}</p>
        <p className="mt-1 text-sm text-white/80">Net salary · {slip.final ? "Paid" : "Not final"}</p>
        <p className="mt-2 text-xs text-white/70">{formatDate(slip.start)} – {formatDate(slip.end)} · Pay date {formatDate(slip.payDate)}</p>
      </section>
      <IllustrativeBanner />
      {groups.map(([title, lines, total]) => (
        <section key={title} className="rounded-2xl border border-line bg-white p-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {title === "Employer contributions" ? <p className="mt-1 text-xs text-teal-800">Paid by the employer. Not deducted from net salary.</p> : null}
          <ul className="mt-2 space-y-2 text-sm">
            {lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3"><span>{line.label}</span><span className="num">{formatRand(line.amount)}</span></li>
            ))}
            <li className="flex justify-between gap-3 border-t border-line pt-2 font-semibold"><span>Total</span><span className="num">{formatRand(total)}</span></li>
          </ul>
        </section>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/me/payslips/${slip.id}/preview`} className="flex h-11 items-center justify-center rounded-lg border border-line bg-white text-sm font-medium">Preview</Link>
        <Button onClick={() => downloadText(`${slip.periodLabel.replaceAll(" ", "-").toLowerCase()}-payslip.txt`, payslipText(slip.periodLabel, totals.gross, totals.employeeDeductions, totals.net, totals.employerContributions))}>Download</Button>
      </div>
      <p className="text-xs leading-5 text-muted">The download is a text copy of this sample payslip. It is not a SARS document, and it does not change the calculation.</p>
    </div>
  );
}

function payslipText(period: string, gross: number, deductions: number, net: number, employer: number) {
  return [`Payslip text copy · ${period}`, "Not a SARS document.", `Gross earnings ${formatRand(gross)}`, `Employee deductions ${formatRand(deductions)}`, `Net salary ${formatRand(net)}`, `Employer contributions ${formatRand(employer)}`, "Employer contributions are not deducted from net salary."].join("\n");
}

export function EmployeePayslipPreview() {
  const { payslipId = "" } = useParams();
  const { slips, org } = useSelf();
  const slip = slips.find((item) => item.id === payslipId);
  if (!slip) return <div className="p-4"><ErrorState title="This payslip is not yours" body="You can only preview your own payslip." /></div>;
  return (
    <div className="space-y-3 px-3 py-4">
      <Link to={`/me/payslips/${slip.id}`} className="px-1 text-sm font-medium text-blue-700">Back to payslip</Link>
      <h1 className="px-1 text-lg font-semibold">Payslip preview</h1>
      <div className="overflow-x-auto">
        <PayslipPaper slip={slip} companyName={org.legalName} companyMeta={org.address.join(", ")} />
      </div>
    </div>
  );
}

export function EmployeeTax() {
  const { slips, employee } = useSelf();
  if (!employee) return null;
  const paye = slips.reduce((sum, slip) => sum + (slip.lines.find((line) => line.code === "PAYE")?.amount ?? 0), 0);
  return (
    <div className="space-y-3 px-4 py-5">
      <Screen title="Tax documents" lede="Your certificate preview for 2026/27. No IRP5 or IT3(a) number has been issued." />
      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-muted">Stored PAYE samples</p>
        <p className="num mt-1 text-2xl font-semibold text-teal-700">{formatRand(paye)}</p>
        <p className="mt-1 text-xs text-muted">October and November samples added together. Not income assessed by SARS.</p>
      </section>
      <Link to="/me/tax/2026-27" className="block rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center justify-between"><span className="font-medium">2026/27 certificate</span><Badge tone="warning">Not issued</Badge></div>
        <p className="mt-1 text-sm text-muted">Draft layout for your record only.</p>
      </Link>
      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">Tax document history</h2>
        <ul className="mt-2 divide-y divide-line text-sm">
          {slips.map((slip) => (
            <li key={slip.id} className="flex justify-between py-2"><span>{slip.periodLabel}</span><span className="num">{formatRand(slip.lines.find((line) => line.code === "PAYE")?.amount ?? 0)}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function EmployeeTaxDetail() {
  const { employee, slips } = useSelf();
  const { yearId = "" } = useParams();
  if (!employee || yearId !== "2026-27") return <div className="p-4"><ErrorState title="Certificate not found" body="The only preview on your record is the 2026/27 draft." /></div>;
  const paye = slips.reduce((sum, slip) => sum + (slip.lines.find((line) => line.code === "PAYE")?.amount ?? 0), 0);
  const gross = slips.reduce((sum, slip) => sum + sumLines(slip.lines).gross, 0);
  return (
    <div className="space-y-3 px-4 py-5">
      <Link to="/me/tax" className="text-sm font-medium text-blue-700">Tax documents</Link>
      <section className="rounded-2xl border border-line bg-white p-5">
        <p className="text-xs tracking-wide text-muted uppercase">Khanyisa Retail (Pty) Ltd</p>
        <h1 className="mt-2 text-lg font-semibold">Sample tax certificate</h1>
        <p className="text-sm text-muted">Not an IRP5. Not an IT3(a).</p>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Tax year" value="2026/27" />
          <Row label="Certificate number" value="Not issued" />
          <Row label="Name" value={fullName(employee)} />
          <Row label="Tax reference" value={employee.taxMasked} />
          <Row label="Gross samples" value={formatRand(gross)} />
          <Row label="PAYE samples" value={formatRand(paye)} />
        </dl>
      </section>
      <Button className="w-full" variant="secondary" onClick={() => downloadText("tax-certificate-preview.txt", `Sample certificate layout for ${fullName(employee)}\nNot an IRP5. Not an IT3(a).\nCertificate number: Not issued\nStored PAYE samples ${formatRand(paye)}\n`)}>Download text copy</Button>
      <p className="text-xs leading-5 text-muted">The file is a text copy of the preview. Nothing is submitted to SARS.</p>
    </div>
  );
}

export function EmployeeLeave() {
  const { employee, requests } = useSelf();
  const [filter, setFilter] = useState("all");
  if (!employee) return null;
  const visible = requests.filter((request) => filter === "all" || request.status === filter);
  return (
    <div className="space-y-3 px-4 py-5">
      <Screen title="Leave" lede="Balances are the days on your record. Approved leave in this demonstration does not reduce them." action={<Link to="/me/leave/request" className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Request</Link>} />
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Annual", employee.leave.annual],
          ["Sick", employee.leave.sick],
          ["Family", employee.leave.family],
        ].map(([label, days]) => (
          <div key={String(label)} className="rounded-2xl border border-line bg-white p-3"><p className="num text-xl font-semibold">{days}</p><p className="text-xs text-muted">{label} days</p></div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["approved", "Approved"],
          ["declined", "Declined"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${filter === id ? "bg-navy text-white" : "border border-line bg-white"}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <Link to="/me/leave/calendar" className="block rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium">Leave calendar</Link>
      {visible.length === 0 ? <EmptyState title="Nothing in this list" body="Request leave, or choose another status." /> : (
        <ul className="space-y-2">
          {visible.map((request) => (
            <li key={request.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
              <div className="flex items-center justify-between"><span className="font-medium">{request.type}</span><Badge tone={leaveTone(request.status)}>{request.status}</Badge></div>
              <p className="mt-1 text-muted">{formatDate(request.start)} – {formatDate(request.end)} · {request.days} days</p>
              {request.decisionNote ? <p className="mt-1">{request.decisionNote}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EmployeeLeaveCalendar() {
  const { requests } = useSelf();
  const marks = requests.flatMap((request) => {
    const days: { day: number; label: string; tone: "teal" | "amber" }[] = [];
    const from = Date.parse(`${request.start}T00:00:00Z`);
    const to = Date.parse(`${request.end}T00:00:00Z`);
    for (let time = from; time <= to; time += 86_400_000) {
      const date = new Date(time);
      if (date.getUTCFullYear() === 2026 && date.getUTCMonth() === 10) {
        days.push({ day: date.getUTCDate(), label: request.type, tone: request.status === "approved" ? "teal" : "amber" });
      }
    }
    return days;
  });
  return (
    <div className="space-y-3 px-4 py-5">
      <Link to="/me/leave" className="text-sm font-medium text-blue-700">Leave</Link>
      <Screen title="Leave calendar" lede="November 2026. Approved leave is teal." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white p-3">
        <MonthGrid year={2026} month={11} marks={marks} />
      </div>
    </div>
  );
}

export function EmployeeLeaveRequest() {
  const { employee, dispatch } = useSelf();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ type: "Annual" as LeaveType, start: "", end: "", note: "", file: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState("");
  if (!employee) return null;
  const days = form.start && form.end ? inclusiveDays(form.start, form.end) : 0;
  function next() {
    const error: Record<string, string> = {};
    if (step === 1) {
      if (!form.start || !form.end || days <= 0) error.dates = "The end date must be on or after the start date.";
      if (form.type === "Annual" && days > employee!.leave.annual) error.dates = `This is longer than the annual balance on record (${employee!.leave.annual} days).`;
      if (form.type === "Family responsibility" && days > employee!.leave.family) error.dates = `This is longer than the family responsibility balance (${employee!.leave.family} days).`;
    }
    if (step === 2 && form.type === "Sick" && form.note.trim().length < 3 && form.file.trim().length < 3) error.note = "Add a note or a document name for sick leave.";
    setErrors(error);
    if (!Object.keys(error).length) setStep((value) => value + 1);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
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
        note: [form.note.trim(), form.file.trim() ? `Document name: ${form.file.trim()}` : ""].filter(Boolean).join(" "),
      },
    });
    setDone(`${form.type} leave for ${days} calendar days is with your manager. The days on record are unchanged until it is approved.`);
  }
  if (done) {
    return (
      <div className="space-y-3 px-4 py-5">
        <h1 className="text-xl font-semibold">Request sent</h1>
        <p className="text-sm leading-6 text-muted">{done}</p>
        <Link to="/me/leave" className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white">Back to leave</Link>
      </div>
    );
  }
  return (
    <form className="space-y-4 px-4 py-5" onSubmit={submit} noValidate>
      <Link to="/me/leave" className="text-sm font-medium text-blue-700">Leave</Link>
      <Screen title="Request leave" lede={`Step ${step + 1} of 4. Public holidays are not deducted in this demonstration.`} />
      {step === 0 ? (
        <Field label="Leave type" htmlFor="leave-type">
          <Select id="leave-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as LeaveType })}>
            <option>Annual</option>
            <option>Sick</option>
            <option>Family responsibility</option>
            <option>Maternity</option>
          </Select>
        </Field>
      ) : null}
      {step === 1 ? (
        <>
          <Field label="From" htmlFor="leave-from" error={errors.dates}><Input id="leave-from" type="date" invalid={Boolean(errors.dates)} value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></Field>
          <Field label="To" htmlFor="leave-to"><Input id="leave-to" type="date" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></Field>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Field label="Note" htmlFor="leave-note" error={errors.note}><Textarea id="leave-note" invalid={Boolean(errors.note)} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
          <Field label="Supporting document" htmlFor="leave-file" hint="Enter a file name. The file itself is not uploaded."><Input id="leave-file" value={form.file} placeholder="clinic-note.pdf" onChange={(event) => setForm({ ...form, file: event.target.value })} /></Field>
        </>
      ) : null}
      {step === 3 ? (
        <section className="rounded-2xl border border-line bg-white p-4 text-sm">
          <h2 className="font-semibold">Confirm the request</h2>
          <p className="mt-2">{form.type}</p>
          <p className="text-muted">{form.start && form.end ? `${formatDate(form.start)} – ${formatDate(form.end)} · ${days} calendar days` : "Dates missing"}</p>
          {form.file ? <p className="mt-1 text-muted">Document name: {form.file}</p> : null}
        </section>
      ) : null}
      <div className="flex gap-2">
        {step > 0 ? <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
        {step < 3 ? <Button type="button" onClick={next}>Continue</Button> : <Button type="submit">Submit request</Button>}
      </div>
    </form>
  );
}

const PROFILE_FIELDS: { field: ProfileField; label: string }[] = [
  { field: "mobile", label: "Mobile number" },
  { field: "address", label: "Residential address" },
  { field: "emergency", label: "Emergency contact" },
  { field: "bank", label: "Bank account" },
];

export function EmployeeProfile() {
  const { employee } = useSelf();
  const desk = useEmployeeDesk();
  if (!employee) return null;
  return (
    <div className="space-y-3 px-4 py-5">
      <Screen title="Profile" lede="You only see your own record. A change waits for your employer." action={<Link to="/me/profile/edit" className="shrink-0 text-sm font-medium text-blue-700">Request a change</Link>} />
      <section className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <h2 className="font-semibold">Personal</h2>
        <Row label="Name" value={fullName(employee)} />
        <Row label="Identity number" value={employee.idMasked} />
      </section>
      <section className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <h2 className="font-semibold">Contact</h2>
        <Row label="Email" value={employee.email} />
        <Row label="Mobile" value={employee.mobile} />
        <Row label="Address" value={desk.address} />
        <Row label="Emergency" value={desk.emergency} />
      </section>
      <section className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <h2 className="font-semibold">Bank and tax</h2>
        <Row label="Bank" value={`${employee.bank} · ${employee.accountMasked}`} />
        <Row label="Tax reference" value={employee.taxMasked} />
        <p className="text-xs text-muted">The account number and tax reference stay masked. A request does not reveal them.</p>
      </section>
      <section className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <h2 className="font-semibold">Employment</h2>
        <Row label="Number" value={employee.employeeNumber} />
        <Row label="Role" value={employee.jobTitle} />
        <Row label="Department" value={employee.department} />
        <Row label="Started" value={formatDate(employee.startDate)} />
      </section>
      {desk.profileRequests.length ? (
        <section className="rounded-2xl border border-line bg-white p-4 text-sm">
          <h2 className="font-semibold">Change requests</h2>
          <ul className="mt-2 space-y-2">
            {desk.profileRequests.map((request) => (
              <li key={request.id}>
                <div className="flex items-center justify-between"><span>{request.label}</span><Badge tone={request.status === "approved" ? "success" : request.status === "declined" ? "danger" : "warning"}>{request.status}</Badge></div>
                {request.response ? <p className="text-muted">{request.response}</p> : <p className="text-muted">Waiting for your employer.</p>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Link to="/me/corrections" className="block text-sm font-medium text-blue-700">Payroll correction requests</Link>
      <Link to="/" className="block text-sm font-medium text-blue-700">Sign out</Link>
    </div>
  );
}

export function EmployeeProfileEdit() {
  const { employee } = useSelf();
  const desk = useEmployeeDesk();
  const [field, setField] = useState<ProfileField>("mobile");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  if (!employee) return null;
  const current = field === "mobile" ? employee.mobile : field === "address" ? desk.address : field === "emergency" ? desk.emergency : `${employee.bank} ${employee.accountMasked}`;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim().length < 3) { setError("Describe the change."); return; }
    if (field === "mobile" && !/^(\+27|0)\d{9}$/.test(value.replaceAll(" ", ""))) { setError("Use a South African mobile number."); return; }
    if (field === "bank" && (value.match(/\d/g)?.length ?? 0) > 4) { setError("Do not type a full account number. Say which masked account should change."); return; }
    submitProfileRequest({
      id: uid("profile"),
      field,
      label: PROFILE_FIELDS.find((item) => item.field === field)?.label ?? "Profile",
      current,
      requested: value.trim(),
      status: "pending",
    });
    setDone("The request is with your employer. Your record is unchanged until they approve it.");
  }
  if (done) return <div className="space-y-3 px-4 py-5"><h1 className="text-xl font-semibold">Request sent</h1><p className="text-sm text-muted">{done}</p><Link to="/me/profile" className="text-sm font-medium text-blue-700">Back to profile</Link></div>;
  return (
    <form className="space-y-4 px-4 py-5" onSubmit={submit} noValidate>
      <Link to="/me/profile" className="text-sm font-medium text-blue-700">Profile</Link>
      <Screen title="Request a change" lede="You cannot edit the record yourself. Payroll approves the change." />
      <Field label="What should change" htmlFor="profile-field">
        <Select id="profile-field" value={field} onChange={(event) => { setField(event.target.value as ProfileField); setValue(""); setError(""); }}>
          {PROFILE_FIELDS.map((item) => <option key={item.field} value={item.field}>{item.label}</option>)}
        </Select>
      </Field>
      <p className="text-sm text-muted">Current: {current}</p>
      <Field label="Requested value" htmlFor="profile-value" error={error} hint={field === "bank" ? "Do not enter a full account number." : "Your employer will see this wording."}>
        <Textarea id="profile-value" invalid={Boolean(error)} value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} />
      </Field>
      <Button type="submit" className="w-full">Send for approval</Button>
    </form>
  );
}

export function EmployeeCorrections() {
  const desk = useEmployeeDesk();
  return (
    <div className="space-y-3 px-4 py-5">
      <Screen title="Correction requests" lede="A request asks payroll to look again. It does not change a payslip." action={<Link to="/me/corrections/new" className="shrink-0 text-sm font-medium text-blue-700">New</Link>} />
      {desk.corrections.length === 0 ? <EmptyState title="No correction requests" body="If a payslip looks wrong, send a note. The lines stay as stored." /> : (
        <ul className="space-y-2">
          {desk.corrections.map((request) => (
            <li key={request.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
              <div className="flex items-center justify-between"><span className="font-medium">{request.period}</span><Badge tone={request.status === "responded" ? "success" : "warning"}>{request.status === "responded" ? "Responded" : "With payroll"}</Badge></div>
              <p className="mt-1">{request.explanation}</p>
              {request.attachment ? <p className="text-muted">Document name: {request.attachment}</p> : null}
              {request.response ? <p className="mt-2 rounded-lg bg-slate-50 p-2">Payroll: {request.response}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EmployeeCorrectionNew() {
  const { slips } = useSelf();
  const [period, setPeriod] = useState(slips[0]?.periodLabel ?? "");
  const [explanation, setExplanation] = useState("");
  const [attachment, setAttachment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!period) { setError("Choose a payroll period."); return; }
    if (explanation.trim().length < 8) { setError("Explain what looks wrong."); return; }
    submitCorrection({ id: uid("corr"), period, explanation: explanation.trim(), attachment: attachment.trim(), status: "submitted" });
    setDone(true);
  }
  if (done) return <div className="space-y-3 px-4 py-5"><h1 className="text-xl font-semibold">Request sent</h1><p className="text-sm text-muted">Payroll has the note. The historical calculation was not edited.</p><Link to="/me/corrections" className="text-sm font-medium text-blue-700">View requests</Link></div>;
  return (
    <form className="space-y-4 px-4 py-5" onSubmit={submit} noValidate>
      <Link to="/me/corrections" className="text-sm font-medium text-blue-700">Corrections</Link>
      <Screen title="Ask payroll to check a payslip" lede="You can explain the issue and name a document. You cannot change the amounts." />
      <Field label="Payroll period" htmlFor="corr-period" error={error}>
        <Select id="corr-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
          {slips.map((slip) => <option key={slip.id}>{slip.periodLabel}</option>)}
        </Select>
      </Field>
      <Field label="What looks wrong" htmlFor="corr-note"><Textarea id="corr-note" value={explanation} onChange={(event) => { setExplanation(event.target.value); setError(""); }} /></Field>
      <Field label="Supporting document" htmlFor="corr-file" hint="A file name only. The file is not uploaded."><Input id="corr-file" value={attachment} placeholder="overtime-roster.pdf" onChange={(event) => setAttachment(event.target.value)} /></Field>
      <Button type="submit" className="w-full">Submit request</Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function EmployeeRequestsPage() {
  const desk = useEmployeeDesk();
  const { dispatch } = useApp();
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader title="Employee requests" description="Profile changes and payslip corrections from Thandiwe Nkosi. Approving a note does not recalculate a payslip." />
      <Card>
        <CardTitle title="Profile changes" />
        {desk.profileRequests.length === 0 ? <EmptyState title="No profile changes" body="A request appears here after Thandiwe sends one from the employee app." /> : (
          <ul className="space-y-4">
            {desk.profileRequests.map((request) => (
              <li key={request.id} className="rounded-xl border border-line p-3 text-sm">
                <div className="flex items-center justify-between"><span className="font-medium">{request.label}</span><Badge tone={request.status === "pending" ? "warning" : request.status === "approved" ? "success" : "danger"}>{request.status}</Badge></div>
                <p className="mt-1 text-muted">Now: {request.current}</p>
                <p>Requested: {request.requested}</p>
                {request.status === "pending" ? (
                  <div className="mt-3 space-y-2">
                    <Textarea value={note[request.id] ?? ""} onChange={(event) => setNote({ ...note, [request.id]: event.target.value })} placeholder="Note to the employee" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        const response = (note[request.id] ?? "").trim();
                        if (response.length < 3) { setError("Add a note before you decide."); return; }
                        if (request.field === "mobile") dispatch({ type: "update-employee-mobile", employeeId: "thandiwe", mobile: request.requested, actor: "Amara Dube" });
                        decideProfileRequest(request.id, "approved", response);
                        setError("");
                      }}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        const response = (note[request.id] ?? "").trim();
                        if (response.length < 3) { setError("Add a note before you decide."); return; }
                        decideProfileRequest(request.id, "declined", response);
                        setError("");
                      }}>Decline</Button>
                    </div>
                  </div>
                ) : <p className="mt-1 text-muted">{request.response}</p>}
              </li>
            ))}
          </ul>
        )}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </Card>
      <Card>
        <CardTitle title="Payslip corrections" description="A response is a note. The stored lines stay as they are." />
        {desk.corrections.length === 0 ? <EmptyState title="No corrections" body="Thandiwe has not asked payroll to check a payslip." /> : (
          <ul className="space-y-4">
            {desk.corrections.map((request) => (
              <li key={request.id} className="rounded-xl border border-line p-3 text-sm">
                <div className="flex items-center justify-between"><span className="font-medium">{request.period}</span><Badge tone={request.status === "responded" ? "success" : "warning"}>{request.status}</Badge></div>
                <p className="mt-1">{request.explanation}</p>
                {request.status === "submitted" ? (
                  <div className="mt-3 space-y-2">
                    <Textarea value={note[request.id] ?? ""} onChange={(event) => setNote({ ...note, [request.id]: event.target.value })} placeholder="Response. The payslip will not be edited." />
                    <Button size="sm" onClick={() => {
                      const response = (note[request.id] ?? "").trim();
                      if (response.length < 3) { setError("Write a response."); return; }
                      respondCorrection(request.id, response);
                      setError("");
                    }}>Send response</Button>
                  </div>
                ) : <p className="mt-1 text-muted">{request.response}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
