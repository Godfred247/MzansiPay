import { useState } from "react";
import { Link } from "react-router-dom";
import { fullName, runEmployees, runStatusMeta, runTotals } from "../domain.ts";
import { formatDate, formatDateTime, formatRand } from "../format.ts";
import { PayrollStatement } from "../finance.tsx";
import { useOrg } from "../state.tsx";
import { useShellLoading } from "../shells.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, EmptyState, LoadingBlock, PageHeader } from "../ui.tsx";

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
  const loading = shellLoading || refreshing;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={org.legalName}
        title="Dashboard"
        description={
          monthly
            ? `${monthly.name} is ${runStatusMeta(monthly.status).label.toLowerCase()}. Pay date ${formatDate(monthly.payDate)}.`
            : `${org.tradingName} is subscribed and has no open payroll run.`
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRefreshing(true);
                window.setTimeout(() => setRefreshing(false), 700);
              }}
            >
              Refresh
            </Button>
            {monthly ? <ButtonLink to={`${base}/payroll/${monthly.id}`}>Review payroll</ButtonLink> : <ButtonLink to={`${base}/employees/new`}>Add employee</ButtonLink>}
          </>
        }
      />
      {loading ? (
        <LoadingBlock label="Refreshing dashboard" />
      ) : !monthly ? (
        <EmptyState
          title="No payroll is open"
          body="Add employees, then open the November run. Essentials is a paid plan. MzansiPay does not include a free plan."
          action={<ButtonLink to={`${base}/employees`}>Go to employees</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.85fr)]">
            <Card>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone={runStatusMeta(monthly.status).tone}>{runStatusMeta(monthly.status).label}</Badge>
                  <h2 className="mt-2 text-lg font-semibold">{monthly.name}</h2>
                  <p className="text-sm text-muted">
                    {formatDate(monthly.start)} – {formatDate(monthly.end)} · {people.length} employees · Prepared by {monthly.preparedBy}
                  </p>
                </div>
                <ButtonLink to={`${base}/payroll/${monthly.id}`} variant="secondary">
                  Open run
                </ButtonLink>
              </div>
              <PayrollStatement lines={lines} taxable={taxable > 0 ? taxable : undefined} />
            </Card>
            <div className="space-y-4">
              <Card>
                <CardTitle title="EMP201 worksheet" description="Due 7 Dec 2026. This is a preparation aid, not a submission to SARS." />
                <ButtonLink to={`${base}/compliance`} variant="secondary" size="sm">
                  Open worksheet
                </ButtonLink>
              </Card>
              <Card>
                <CardTitle title="Needs a decision" description="Items waiting on this organisation." />
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start justify-between gap-3">
                    <span>Payroll approval</span>
                    <Badge tone={monthly.status === "in_review" ? "warning" : "neutral"}>{monthly.status === "in_review" ? "Waiting" : runStatusMeta(monthly.status).label}</Badge>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <span>Leave requests</span>
                    <Badge tone={pendingLeave.length ? "warning" : "success"}>{pendingLeave.length} pending</Badge>
                  </li>
                </ul>
                <div className="mt-4">
                  <Link className="text-sm font-medium text-blue-700" to={`${base}/leave`}>
                    Review leave
                  </Link>
                </div>
              </Card>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle title="Other pay cycles" description="Weekly and fortnightly employees are not included in the monthly run." />
              <ul className="divide-y divide-line">
                {runs
                  .filter((run) => run.id !== monthly.id)
                  .map((run) => {
                    const totals = runTotals(run, employees);
                    return (
                      <li key={run.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <Link className="font-medium text-blue-700" to={`${base}/payroll/${run.id}`}>
                            {run.name}
                          </Link>
                          <p className="text-xs text-muted">Pay date {formatDate(run.payDate)}</p>
                        </div>
                        <div className="text-right">
                          <Badge tone={runStatusMeta(run.status).tone}>{runStatusMeta(run.status).label}</Badge>
                          <p className="num mt-1 text-sm">{run.calculated ? formatRand(totals.net) : "Not calculated"}</p>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </Card>
            <Card>
              <CardTitle title="Recent audit" description="Security and payroll actions for this organisation." />
              <ul className="space-y-3">
                {audit.slice(0, 4).map((event) => (
                  <li key={event.id} className="text-sm">
                    <p className="font-medium">{event.action}</p>
                    <p className="text-muted">{event.detail}</p>
                    <p className="text-xs text-muted">
                      {event.actor} · {formatDateTime(event.at)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          {pendingLeave.length > 0 ? (
            <Card>
              <CardTitle title="Open leave" />
              <ul className="divide-y divide-line text-sm">
                {pendingLeave.map((request) => {
                  const person = employees.find((employee) => employee.id === request.employeeId);
                  return (
                    <li key={request.id} className="flex justify-between py-2">
                      <span>{person ? fullName(person) : "Employee"} · {request.type}</span>
                      <span className="text-muted">
                        {formatDate(request.start)} · {request.days} days
                      </span>
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
