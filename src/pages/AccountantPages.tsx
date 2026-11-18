import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { runStatusMeta, runTotals } from "../domain.ts";
import { formatDate, formatRand, uid } from "../format.ts";
import { IllustrativeBanner } from "../finance.tsx";
import { CALENDAR, CLIENTS, PRACTICE_INVOICES, PRACTICE_PLANS } from "../sample.ts";
import { useApp } from "../state.tsx";
import { PRACTICE } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, ConfirmDialog, EmptyState, Field, Input, PageHeader, Select } from "../ui.tsx";

function liveSummary(clientId: string, state: ReturnType<typeof useApp>["state"]) {
  if (clientId !== "khanyisa" && clientId !== "moloto") return null;
  if (!state.accountantAccess[clientId]) return "Access revoked. Payroll data is hidden.";
  const run = state.runs.find((item) => item.orgId === clientId && item.frequency === "monthly");
  if (!run) return "No payroll run is open.";
  return `${run.name} · ${runStatusMeta(run.status).label}`;
}

export function PracticeDashboardPage() {
  const { state } = useApp();
  const authorised = CLIENTS.filter((client) => client.access === "authorised" && state.accountantAccess[client.id as "khanyisa"] !== false);
  const waiting = state.runs.filter((run) => run.status === "in_review" && state.accountantAccess[run.orgId]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Practice dashboard" description="Authorised client files for November. Pending invitations do not show payroll amounts." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <Card padding={false}>
          <div className="border-b border-line px-5 py-4">
            <CardTitle title="Client payroll status" description={`${authorised.length} authorised files · ${waiting.length} waiting on an employer`} />
          </div>
          <ul className="divide-y divide-line">
            {CLIENTS.map((client) => {
              const locked = client.access === "pending" || (client.id === "khanyisa" || client.id === "moloto" ? !state.accountantAccess[client.id] : false);
              return (
                <li key={client.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <Link className="font-medium text-blue-700" to={`/a/clients/${client.id}`}>
                      {client.tradingName}
                    </Link>
                    <p className="text-sm text-muted">{client.city} · {client.assignee}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={locked ? "neutral" : client.blocked ? "danger" : "info"}>{locked ? "No access" : client.blocked ? "Blocked" : "Authorised"}</Badge>
                    <p className="mt-1 text-sm text-muted">{locked ? "Payroll data hidden" : liveSummary(client.id, state) ?? client.summary}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardTitle title="Coming up" description="Practice deadlines. EMP201 dates are reminders, not filings." />
            <ul className="space-y-3 text-sm">
              {CALENDAR.map((event) => (
                <li key={`${event.date}-${event.client}`}>
                  <p className="font-medium">{formatDate(event.date)}</p>
                  <p className="text-muted">{event.client} · {event.title}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle title="Team this period" />
            <ul className="space-y-2 text-sm">
              {state.team.filter((member) => member.status === "active").map((member) => (
                <li key={member.id} className="flex justify-between">
                  <span>{member.name}</span>
                  <span className="text-muted">{member.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ClientsPage() {
  const { state } = useApp();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Clients" description="Open a file only when the employer has authorised Harbour & Co." />
      <div className="grid gap-4 md:grid-cols-2">
        {CLIENTS.map((client) => {
          const revoked = (client.id === "khanyisa" || client.id === "moloto") && !state.accountantAccess[client.id];
          return (
            <Card key={client.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{client.legalName}</h2>
                  <p className="text-sm text-muted">{client.city} · Since {formatDate(client.since)}</p>
                </div>
                <Badge tone={client.access === "pending" || revoked ? "warning" : "teal"}>{revoked ? "Revoked" : client.access === "pending" ? "Pending" : "Authorised"}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted">{revoked ? "The employer removed access. No payroll data is available." : client.summary}</p>
              <div className="mt-4">
                <ButtonLink to={`/a/clients/${client.id}`} variant="secondary" size="sm">
                  View client
                </ButtonLink>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ClientOverviewPage() {
  const { clientId } = useParams();
  const { state } = useApp();
  const client = CLIENTS.find((item) => item.id === clientId);
  if (!client) return <EmptyState title="Client not found" body="Return to the client list." />;
  const revoked = (client.id === "khanyisa" || client.id === "moloto") && !state.accountantAccess[client.id];
  const locked = client.access === "pending" || revoked;
  const monthly = state.runs.find((run) => run.orgId === client.id && run.frequency === "monthly");
  const totals = monthly ? runTotals(monthly, state.employees) : null;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={client.city} title={client.legalName} description={locked ? "Payroll data stays hidden until access is authorised." : client.summary} />
      {locked ? (
        <EmptyState title="No payroll data" body={revoked ? "The employer has revoked Harbour & Co. Payroll stays hidden until they authorise access again." : "This employer has not authorised Harbour & Co. Employee and pay details are hidden."} />
      ) : (
        <>
          {client.blocked ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{client.blocked}</div> : null}
          {client.control ? (
            <Card>
              <CardTitle title="Practice control totals" description="Sample totals for a client whose employee register is not in this demonstration." />
              <IllustrativeBanner />
              <dl className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
                <div><dt className="text-muted">Gross</dt><dd className="num font-semibold">{formatRand(client.control.gross)}</dd></div>
                <div><dt className="text-muted">Net salaries</dt><dd className="num font-semibold text-teal-700">{formatRand(client.control.net)}</dd></div>
                <div><dt className="text-muted">PAYE sample</dt><dd className="num font-semibold">{formatRand(client.control.paye)}</dd></div>
                <div><dt className="text-muted">Employer cost</dt><dd className="num font-semibold">{formatRand(client.control.employerCost)}</dd></div>
              </dl>
            </Card>
          ) : null}
          {totals && monthly?.calculated ? (
            <Card>
              <CardTitle title="November control totals" description="Taken from the client file in this demonstration." />
              <IllustrativeBanner />
              <p className="mt-3 text-sm">Net salaries <span className="num font-semibold text-teal-700">{formatRand(totals.net)}</span> · Employer cost <span className="num font-semibold">{formatRand(totals.employerCost)}</span></p>
            </Card>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {client.workspace && !revoked ? <ButtonLink to={`/a/client/${client.id}`}>Open payroll workspace</ButtonLink> : null}
            <ButtonLink to="/a/clients" variant="secondary">All clients</ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}

export function CalendarPage() {
  const first = new Date(Date.UTC(2026, 10, 1));
  const startWeekday = first.getUTCDay();
  const days = Array.from({ length: 30 }, (_, index) => index + 1);
  const cells = [...Array.from({ length: startWeekday }, () => 0), ...days];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Payroll calendar" description="November 2026 for authorised clients. 18 Nov is today in this demonstration." />
      <Card>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium tracking-wide text-muted uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map((day, index) => {
            const iso = day ? `2026-11-${String(day).padStart(2, "0")}` : "";
            const events = CALENDAR.filter((event) => event.date === iso);
            return (
              <div key={index} className={`min-h-20 rounded-lg border p-2 text-left text-xs ${day === 18 ? "border-blue-600 bg-blue-50" : "border-line"}`}>
                <span className="font-medium">{day || ""}</span>
                {events.map((event) => (
                  <p key={event.title + event.client} className="mt-1 text-[11px] leading-4 text-muted">{event.client}</p>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardTitle title="Also coming up" />
        <p className="text-sm">7 Dec 2026 · EMP201 due for authorised clients. This is a diary reminder, not a filing.</p>
      </Card>
    </div>
  );
}

export function ProcessingPage() {
  const { state } = useApp();
  const rows = [
    ...state.runs.filter((run) => state.accountantAccess[run.orgId]).map((run) => ({
      id: run.id,
      client: state.orgs[run.orgId].tradingName,
      name: run.name,
      status: runStatusMeta(run.status).label,
      assignee: run.preparedBy,
      href: `/a/client/${run.orgId}/payroll/${run.id}`,
    })),
    { id: "umhlanga", client: "Umhlanga Dental", name: "November monthly", status: "Approved", assignee: "Yusuf Abrahams", href: "/a/clients/umhlanga" },
    { id: "bergwind", client: "Bergwind Logistics", name: "November monthly", status: "Blocked", assignee: "Candice Pillay", href: "/a/clients/bergwind" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Payroll processing" description="The queue for this period. Open a client file to prepare the run." />
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{row.client}</p>
                <h2 className="font-semibold">{row.name}</h2>
                <p className="text-sm text-muted">{row.assignee}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={row.status === "Blocked" ? "danger" : row.status === "Approved" || row.status === "Paid" ? "success" : "warning"}>{row.status}</Badge>
                <ButtonLink to={row.href} size="sm" variant="secondary">Open</ButtonLink>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PracticeApprovalsPage() {
  const { state } = useApp();
  const waiting = state.runs.filter((run) => state.accountantAccess[run.orgId] && (run.status === "in_review" || run.status === "draft"));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Approvals" description="The employer approves payroll. The practice can see what is still outstanding." />
      {waiting.length === 0 ? (
        <EmptyState title="Nothing is waiting" body="Draft and in-review runs appear here." />
      ) : (
        waiting.map((run) => (
          <Card key={run.id}>
            <h2 className="font-semibold">{state.orgs[run.orgId].tradingName}</h2>
            <p className="text-sm text-muted">{run.name} · {runStatusMeta(run.status).label}</p>
            <p className="mt-2 text-sm">{run.status === "in_review" ? "Waiting on Amara Dube." : "Still in draft with the practitioner."}</p>
            <div className="mt-3">
              <ButtonLink to={`/a/client/${run.orgId}/payroll/${run.id}`} size="sm" variant="secondary">Open run</ButtonLink>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export function PracticeCompliancePage() {
  const rows = [
    ["Khanyisa Retail", "Worksheet ready", "7 Dec 2026"],
    ["Umhlanga Dental", "Employer approved, worksheet not started", "7 Dec 2026"],
    ["Bergwind Logistics", "Blocked before a worksheet can be prepared", "7 Dec 2026"],
    ["Moloto Studio", "No payroll run", "7 Dec 2026"],
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Statutory compliance" description="A cross-client view of November EMP201 preparation. These are not SARS submissions." />
      <IllustrativeBanner />
      <Card padding={false}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">EMP201 worksheet</th>
              <th className="px-5 py-3">Diary date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t border-line">
                {row.map((cell) => (
                  <td key={cell} className="px-5 py-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function PracticeReportsPage() {
  const [noted, setNoted] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Reports" description="Practice packs summarise status. They do not replace the client payroll report." />
      {noted ? <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{noted} marked prepared. No payroll file was generated.</p> : null}
      {[
        ["Client status pack", "Who is in review, approved, blocked or not started."],
        ["Deadline pack", "Pay dates and the 7 Dec EMP201 diary date."],
        ["Authorisation pack", "Which employers have granted access."],
      ].map(([title, body]) => (
        <Card key={title}>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{body}</p>
          <Button className="mt-3" variant="secondary" onClick={() => setNoted(title)}>
            Note as prepared
          </Button>
        </Card>
      ))}
    </div>
  );
}

export function TeamPage() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ name: "", email: "", role: "Payroll practitioner" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Enter a name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch({ type: "add-team", actor: PRACTICE.actor, member: { id: uid("team"), name: form.name.trim(), email: form.email.trim(), role: form.role, status: "invited" } });
    setForm({ name: "", email: "", role: "Payroll practitioner" });
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Team members" description="Partners, practitioners and reviewers who can be assigned to a client file." />
      <Card>
        <ul className="divide-y divide-line text-sm">
          {state.team.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-2">
              <span>
                <span className="font-medium">{member.name}</span>
                <span className="block text-muted">{member.email}</span>
              </span>
              <Badge tone={member.status === "active" ? "success" : "info"}>{member.role}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit} noValidate>
          <CardTitle title="Invite a teammate" />
          <Field label="Name" htmlFor="team-name" error={errors.name}>
            <Input id="team-name" invalid={Boolean(errors.name)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Email" htmlFor="team-email" error={errors.email}>
            <Input id="team-email" invalid={Boolean(errors.email)} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Role" htmlFor="team-role">
            <Select id="team-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option>Payroll practitioner</option>
              <option>Reviewer</option>
              <option>Practice administrator</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Send invitation</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function PracticeSettingsPage() {
  const { state, dispatch } = useApp();
  const [off, setOff] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Practice settings" description="Practice profile and the security check on this session." />
      <Card>
        <CardTitle title="Practice profile" />
        <p className="text-sm">Harbour & Co · Cape Town · practice@harbourco.example · Practice number PR-00421</p>
        <p className="mt-2 text-sm text-muted">Client payroll is visible only where the employer has authorised this practice.</p>
      </Card>
      <Card>
        <CardTitle title="Security" description="Two-factor authentication protects the practice sign-in." />
        <p className="text-sm">{state.twoFactor ? "Two-factor authentication is on." : "Two-factor authentication is off."}</p>
        <Button className="mt-3" variant={state.twoFactor ? "danger" : "primary"} onClick={() => (state.twoFactor ? setOff(true) : dispatch({ type: "set-two-factor", enabled: true, actor: PRACTICE.actor }))}>
          {state.twoFactor ? "Turn off" : "Turn on"}
        </Button>
      </Card>
      <ConfirmDialog open={off} title="Turn off two-factor authentication?" body="Practice files include other companies' payroll." confirmLabel="Turn off" tone="danger" onClose={() => setOff(false)} onConfirm={() => { dispatch({ type: "set-two-factor", enabled: false, actor: PRACTICE.actor }); setOff(false); }} />
    </div>
  );
}

export function PracticeBillingPage() {
  const { state, dispatch } = useApp();
  const [planId, setPlanId] = useState<string | null>(null);
  const [cancel, setCancel] = useState(false);
  const current = PRACTICE_PLANS.find((plan) => plan.id === state.practicePlanId);
  const upcoming = PRACTICE_PLANS.find((plan) => plan.id === state.practiceNextPlanId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={PRACTICE.name} title="Subscription and billing" description="The practice plan is paid monthly. There is no free plan." />
      {state.practiceCancelOn ? <p className="text-sm text-amber-800">The practice subscription ends on 1 Dec 2026.</p> : null}
      {upcoming ? <p className="text-sm">{upcoming.name} starts on 1 Dec 2026.</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {PRACTICE_PLANS.map((plan) => (
          <Card key={plan.id}>
            <h2 className="font-semibold">{plan.name}</h2>
            <p className="num mt-1 text-2xl font-semibold">{formatRand(plan.price)}<span className="text-sm font-normal text-muted"> / month</span></p>
            <p className="text-sm text-muted">{plan.audience}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">{plan.points.map((point) => <li key={point}>{point}</li>)}</ul>
            <Button className="mt-4" variant={plan.id === current?.id ? "secondary" : "primary"} disabled={plan.id === current?.id} onClick={() => setPlanId(plan.id)}>
              {plan.id === current?.id ? "Current plan" : "Schedule change"}
            </Button>
          </Card>
        ))}
      </div>
      <Card>
        <CardTitle title="Invoices" description="Sample billing documents, VAT included in the total." />
        <ul className="divide-y divide-line text-sm">
          {PRACTICE_INVOICES.map((invoice) => (
            <li key={invoice.id} className="flex justify-between py-2">
              <span>{invoice.id} · {formatDate(invoice.date)}</span>
              <span className="num">{formatRand(invoice.total)}</span>
            </li>
          ))}
        </ul>
      </Card>
      {!state.practiceCancelOn ? <Button variant="danger" onClick={() => setCancel(true)}>Cancel at period end</Button> : null}
      <ConfirmDialog open={planId !== null} title="Schedule the practice plan change?" body="The change starts on 1 Dec 2026." confirmLabel="Schedule change" onClose={() => setPlanId(null)} onConfirm={() => { if (planId) dispatch({ type: "set-practice-plan", planId, actor: PRACTICE.actor }); setPlanId(null); }} />
      <ConfirmDialog open={cancel} title="Cancel the practice subscription?" body="Client access through MzansiPay ends on 1 Dec 2026. There is no free plan after that." confirmLabel="Cancel subscription" tone="danger" onClose={() => setCancel(false)} onConfirm={() => { dispatch({ type: "cancel-practice", actor: PRACTICE.actor }); setCancel(false); }} />
    </div>
  );
}
