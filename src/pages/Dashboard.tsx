import { useState } from "react";
import { Link } from "react-router-dom";
import { byDepartment, fullName, runEmployees, runStatusMeta, runTotals, sumCode } from "../domain.ts";
import { formatDate, formatDateTime, formatRand } from "../format.ts";
import { IllustrativeBanner, PayrollStatement } from "../finance.tsx";
import { useOrg } from "../state.tsx";
import { useShellLoading } from "../shells.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, EmptyState, LoadingBlock, PageHeader } from "../ui.tsx";
import { FlowDiagram, MeterList, SplitBar } from "../visuals.tsx";

export function DashboardPage() {
  const shellLoading = useShellLoading();
  const [refreshing, setRefreshing] = useState(false);
  const { org, employees, runs, leave, audit } = useOrg();
  const { base } = useWorkspace();
  const monthly = runs.find((run) => run.frequency === "monthly");
  const people = monthly ? runEmployees(monthly, employees) : [];
  const lines = monthly?.calculated ? people.flatMap((employee) => employee.lines) : [];
  const taxable = people.reduce((sum, employee) => sum + employee.taxableSample, 0);
  const pendingLeave = leave.filter((request) => request.status === "pending");
  const active = employees.filter((employee) => employee.status === "active");
  const loading = shellLoading || refreshing;
  const departments = byDepartment(active).sort((a, b) => b.totals.gross - a.totals.gross);
  const grossMax = departments[0]?.totals.gross || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={org.legalName}
        title="Dashboard"
        description={monthly ? `${monthly.name} is ${runStatusMeta(monthly.status).label.toLowerCase()}. Pay date ${formatDate(monthly.payDate)}.` : `${org.tradingName} is subscribed and has no open payroll run.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => { setRefreshing(true); window.setTimeout(() => setRefreshing(false), 700); }}>Refresh</Button>
            {monthly ? <ButtonLink to={`${base}/payroll/${monthly.id}`}>Review payroll</ButtonLink> : <ButtonLink to={`${base}/employees/new`}>Add employee</ButtonLink>}
          </>
        }
      />
      {loading ? (
        <LoadingBlock label="Refreshing dashboard" />
      ) : !monthly ? (
        <EmptyState title="No payroll is open" body="Add employees, then open the November run. This organisation is on a paid plan." action={<ButtonLink to={`${base}/employees`}>Go to employees</ButtonLink>} />
      ) : (
        <>
          <IllustrativeBanner />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Active employees", String(active.length), `${employees.filter((employee) => employee.status === "terminated").length} archived`],
              ["Net salaries", formatRand(runTotals(monthly, employees).net), "After employee deductions"],
              ["Employer payroll cost", formatRand(runTotals(monthly, employees).employerCost), "Gross plus employer contributions"],
              ["PAYE sample", formatRand(sumCode(lines, "PAYE")), "Not a SARS determination"],
            ].map(([label, value, hint]) => (
              <Card key={label}>
                <p className="text-sm text-muted">{label}</p>
                <p className="num mt-1 text-2xl font-semibold tracking-tight text-teal-700">{value}</p>
                <p className="mt-1 text-xs text-muted">{hint}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
            <Card>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={runStatusMeta(monthly.status).tone}>{runStatusMeta(monthly.status).label}</Badge>
                  <h2 className="mt-2 text-lg font-semibold">Payroll overview · {monthly.name}</h2>
                  <p className="text-sm text-muted">{formatDate(monthly.start)} – {formatDate(monthly.end)} · {people.length} employees · Prepared by {monthly.preparedBy}</p>
                </div>
                <ButtonLink to={`${base}/payroll/${monthly.id}`} variant="secondary">Open run</ButtonLink>
              </div>
              <PayrollStatement lines={lines} taxable={taxable > 0 ? taxable : undefined} />
              <div className="mt-5">
                <FlowDiagram />
              </div>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardTitle title="Payroll approval" description={monthly.status === "in_review" ? "This run is waiting for the employer." : "The monthly run is not waiting for approval."} />
                <ButtonLink to={`${base}/approvals`} size="sm">{monthly.status === "in_review" ? "Open the queue" : "View approvals"}</ButtonLink>
              </Card>
              <Card>
                <CardTitle title="Statutory deadline" description="EMP201 worksheet for November is due 7 Dec 2026. It is a preparation aid, not a submission to SARS." />
                <ButtonLink to={`${base}/compliance`} variant="secondary" size="sm">Open worksheet</ButtonLink>
              </Card>
              <Card>
                <CardTitle title="Leave waiting" description={pendingLeave.length ? `${pendingLeave.length} request${pendingLeave.length === 1 ? "" : "s"} need a decision.` : "No leave is waiting."} />
                <ButtonLink to={`${base}/leave`} variant="secondary" size="sm">Review leave</ButtonLink>
              </Card>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle title="Where the gross pay sits" description="Employee deductions are not added to employer contributions." />
              <div className="grid gap-6">
                <SplitBar
                  title="Employee side"
                  note="Adds to gross"
                  parts={[
                    { label: "Net salaries", value: runTotals(monthly, employees).net, tone: "teal" },
                    { label: "Employee deductions", value: runTotals(monthly, employees).employeeDeductions, tone: "navy" },
                  ]}
                />
                <SplitBar
                  title="Employer cost"
                  note="Separate from net pay"
                  parts={[
                    { label: "Gross earnings", value: runTotals(monthly, employees).gross, tone: "blue" },
                    { label: "Employer contributions", value: runTotals(monthly, employees).employerContributions, tone: "teal" },
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardTitle title="Active employees by department" description="Gross earnings on the current sample lines." />
              {departments.length === 0 ? (
                <EmptyState title="No active employees" body="The register is empty for this organisation." />
              ) : (
                <MeterList rows={departments.map((row) => ({ label: row.department, value: row.totals.gross, max: grossMax, detail: `${row.count} · ${formatRand(row.totals.gross)}` }))} />
              )}
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardTitle title="PAYE and statutory samples" />
              <ul className="space-y-2 text-sm">
                {[
                  ["PAYE", sumCode(lines, "PAYE")],
                  ["UIF employee", sumCode(lines, "UIF")],
                  ["UIF employer", sumCode(lines, "UIF-ER")],
                  ["SDL", sumCode(lines, "SDL")],
                ].map(([label, amount]) => (
                  <li key={String(label)} className="flex justify-between gap-3 border-b border-line py-2">
                    <span className="text-muted">{label}</span>
                    <span className="num font-medium">{formatRand(Number(amount))}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardTitle title="Upcoming payroll dates" />
              <ul className="space-y-3 text-sm">
                {runs.map((run) => (
                  <li key={run.id} className="flex items-start justify-between gap-3">
                    <span>
                      <Link className="font-medium text-blue-700" to={`${base}/payroll/${run.id}`}>{run.name}</Link>
                      <span className="mt-0.5 block text-muted">Pay {formatDate(run.payDate)}</span>
                    </span>
                    <Badge tone={runStatusMeta(run.status).tone}>{runStatusMeta(run.status).label}</Badge>
                  </li>
                ))}
                <li className="text-muted">EMP201 worksheet · 7 Dec 2026</li>
              </ul>
            </Card>
            <Card>
              <CardTitle title="Quick actions" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Add employee", `${base}/employees/new`],
                  ["Salary structures", `${base}/structures`],
                  ["Payroll calendar", `${base}/payroll/calendar`],
                  ["Leave calendar", `${base}/leave/calendar`],
                  ["Documents", `${base}/documents`],
                  ["Approvals", `${base}/approvals`],
                ].map(([label, href]) => (
                  <Link key={href} to={href} className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-blue-200">{label}</Link>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <CardTitle title="Recent payroll activity" />
            <ul className="divide-y divide-line">
              {audit.slice(0, 5).map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                  <span>
                    <span className="font-medium">{event.action}</span>
                    <span className="mt-0.5 block text-muted">{event.detail}</span>
                  </span>
                  <span className="text-xs text-muted">{event.actor} · {formatDateTime(event.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
          {pendingLeave.length > 0 ? (
            <Card>
              <CardTitle title="Open leave" />
              <ul className="divide-y divide-line text-sm">
                {pendingLeave.map((request) => {
                  const person = employees.find((employee) => employee.id === request.employeeId);
                  return (
                    <li key={request.id} className="flex justify-between py-2">
                      <span>{person ? fullName(person) : "Employee"} · {request.type}</span>
                      <span className="text-muted">{formatDate(request.start)} · {request.days} days</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
