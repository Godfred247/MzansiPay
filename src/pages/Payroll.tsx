import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CODES, frequencyLabel, fullName, linesOf, runEmployees, runStatusMeta, runTotals, sumLines } from "../domain.ts";
import { formatDate, formatRand } from "../format.ts";
import { EmployeeBreakdown, IllustrativeBanner, PayrollStatement } from "../finance.tsx";
import { useApp, useOrg } from "../state.tsx";
import { useShellLoading } from "../shells.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, Card, CardTitle, ConfirmDialog, EmptyState, ErrorState, PageHeader } from "../ui.tsx";

const steps = ["Period and employees", "Earnings", "Employee deductions", "Employer contributions", "Review and approve"];

export function PayrollListPage() {
  const loading = useShellLoading();
  const { runs, employees, org } = useOrg();
  const { dispatch } = useApp();
  const { base, actor } = useWorkspace();
  const activeEmployees = employees.filter((employee) => employee.status !== "terminated");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payroll" description="Each pay frequency has its own run. Figures on a calculated run are illustrative samples." />
      {loading ? null : runs.length === 0 ? (
        <EmptyState
          title="No payroll run is open"
          body={activeEmployees.length === 0 ? "Add at least one employee, then open November payroll. Statutory amounts are not calculated for you." : "Open the November monthly run. It will use basic salary only until pay lines are added."}
          action={
            org.id === "moloto" ? (
              <Button disabled={activeEmployees.length === 0} onClick={() => dispatch({ type: "create-moloto-run", actor })}>
                Open November payroll
              </Button>
            ) : (
              <ButtonLink to={`${base}/employees/new`}>Add employee</ButtonLink>
            )
          }
        />
      ) : (
        <div className="grid gap-4">
          {runs.map((run) => {
            const totals = runTotals(run, employees);
            const meta = runStatusMeta(run.status);
            return (
              <Card key={run.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <h2 className="mt-2 text-lg font-semibold">
                      <Link className="hover:text-blue-700" to={`${base}/payroll/${run.id}`}>
                        {run.name}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted">
                      {frequencyLabel(run.frequency)} · {formatDate(run.start)} – {formatDate(run.end)} · Pay date {formatDate(run.payDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Net salaries</p>
                    <p className="num text-lg font-semibold text-teal-700">{run.calculated ? formatRand(totals.net) : "Not calculated"}</p>
                    <p className="text-xs text-muted">Employer cost {run.calculated ? formatRand(totals.employerCost) : "—"}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PayrollRunPage() {
  const { runId } = useParams();
  const { employees, runs, org } = useOrg();
  const { dispatch } = useApp();
  const { base, mode, actor } = useWorkspace();
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState<"approve" | "submit" | "reopen" | null>(null);
  const run = runs.find((item) => item.id === runId);
  if (!run) return <ErrorState title="Payroll run not found" body="This run is not on the current organisation." />;
  const people = runEmployees(run, employees);
  const lines = run.calculated ? people.flatMap((employee) => employee.lines) : [];
  const totals = runTotals(run, employees);
  const taxable = people.reduce((sum, employee) => sum + employee.taxableSample, 0);
  const meta = runStatusMeta(run.status);
  const outside = employees.filter(
    (employee) => employee.status === "active" && employee.frequency === run.frequency && !run.employeeIds.includes(employee.id),
  );
  const overtime = people.filter((employee) => employee.lines.some((line) => line.code === CODES.overtime && line.amount >= 1500));
  const missingBank = people.filter((employee) => employee.accountMasked === "Not captured");
  const missingStatutory = run.calculated && !lines.some((line) => line.code === CODES.paye);

  function confirmAction() {
    if (confirm === "approve") dispatch({ type: "approve-run", runId: run!.id, actor });
    if (confirm === "submit") dispatch({ type: "submit-run", runId: run!.id, actor });
    if (confirm === "reopen") dispatch({ type: "reopen-run", runId: run!.id, actor });
    setConfirm(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${org.tradingName} · ${frequencyLabel(run.frequency)}`}
        title={run.name}
        description={`Pay date ${formatDate(run.payDate)}. Prepared by ${run.preparedBy}.`}
        actions={<ButtonLink to={`${base}/payroll`} variant="secondary">All runs</ButtonLink>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {run.approvedBy ? <span className="text-sm text-muted">Approved by {run.approvedBy}</span> : null}
      </div>
      {!run.calculated ? (
        <Card>
          <CardTitle title="This run has not been calculated" description="Hours are still being captured. You can place the stored sample lines on the run. That does not perform a statutory calculation." />
          <Button onClick={() => dispatch({ type: "calculate-run", runId: run.id, actor })}>Use sample lines</Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ol className="space-y-1">
            {steps.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${index === step ? "bg-blue-50 font-medium text-blue-800" : "text-muted hover:bg-slate-50"}`}
                  onClick={() => setStep(index)}
                >
                  <span className="num grid h-6 w-6 place-items-center rounded-full bg-white text-xs ring-1 ring-line">{index + 1}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
          <div className="space-y-4">
            {step === 0 ? (
              <Card>
                <CardTitle title="Who is in this run" description={`${formatDate(run.start)} to ${formatDate(run.end)}.`} />
                <ul className="divide-y divide-line">
                  {people.map((employee) => (
                    <li key={employee.id} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <Link className="font-medium text-blue-700" to={`${base}/employees/${employee.id}`}>
                          {fullName(employee)}
                        </Link>
                        <span className="block text-xs text-muted">{employee.jobTitle}</span>
                      </span>
                      <span className="num">{formatRand(sumLines(employee.lines).gross)}</span>
                    </li>
                  ))}
                </ul>
                {outside.length > 0 ? (
                  <p className="mt-3 text-sm text-amber-800">{outside.map(fullName).join(", ")} {outside.length === 1 ? "is" : "are"} active on this frequency and not in the run.</p>
                ) : (
                  <p className="mt-3 text-sm text-muted">Everyone active on this frequency is included. Other frequencies stay on their own runs.</p>
                )}
              </Card>
            ) : null}
            {step === 1 ? <LineStep title="Earnings" kind="earning" people={people} note="Gross earnings are the sum of these lines." /> : null}
            {step === 2 ? (
              <LineStep title="Employee deductions" kind="employee_deduction" people={people} note="These amounts are withheld from employees and reduce net salary. Sample PAYE and UIF sit here." />
            ) : null}
            {step === 3 ? (
              <LineStep title="Employer contributions" kind="employer_contribution" people={people} note="These amounts are paid by the employer. They are not deducted from net salary." emphasis />
            ) : null}
            {step === 4 ? (
              <Card>
                <CardTitle title="Review" description="Check net salary separately from employer cost before you approve." />
                <PayrollStatement lines={lines} taxable={taxable > 0 ? taxable : undefined} />
                <div className="mt-5">
                  <EmployeeBreakdown employees={people} employeeHref={(id) => `${base}/employees/${id}`} />
                </div>
                <div className="mt-5 space-y-2 text-sm">
                  {overtime.map((employee) => (
                    <p key={employee.id} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-950">
                      Check overtime for {fullName(employee)} before approval. The amount is a stored sample.
                    </p>
                  ))}
                  {missingBank.map((employee) => (
                    <p key={employee.id} className="rounded-lg bg-amber-50 px-3 py-2 text-amber-950">
                      {fullName(employee)} has no captured bank account. Payment cannot be matched to an account.
                    </p>
                  ))}
                  {missingStatutory ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-950">No PAYE, UIF or SDL sample lines are on this run. This demonstration does not calculate them.</p>
                  ) : (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-muted">PAYE, UIF and SDL lines on this run are samples, not a legal calculation.</p>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {run.status === "draft" ? <Button onClick={() => setConfirm("submit")}>Submit for review</Button> : null}
                  {run.status === "in_review" && mode === "employer" ? <Button onClick={() => setConfirm("approve")}>Approve payroll</Button> : null}
                  {run.status === "in_review" && mode === "accountant" ? <Button disabled>Waiting for employer approval</Button> : null}
                  {(run.status === "in_review" || run.status === "approved") && mode === "employer" ? (
                    <Button variant="secondary" onClick={() => setConfirm("reopen")}>
                      Return to draft
                    </Button>
                  ) : null}
                  {run.status === "approved" ? <ButtonLink to={`${base}/payments`} variant="secondary">Go to payments</ButtonLink> : null}
                  {run.status === "paid" ? <Badge tone="success">Paid</Badge> : null}
                </div>
              </Card>
            ) : null}
            <div className="flex justify-between">
              <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
                Back
              </Button>
              {step < steps.length - 1 ? <Button onClick={() => setStep((value) => value + 1)}>Continue</Button> : null}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "approve" ? "Approve this payroll?" : confirm === "reopen" ? "Return this run to draft?" : "Submit this payroll for review?"}
        confirmLabel={confirm === "approve" ? "Approve payroll" : confirm === "reopen" ? "Return to draft" : "Submit"}
        tone={confirm === "reopen" ? "danger" : "primary"}
        requireCheck={confirm === "approve"}
        checkLabel="I am approving the sample totals shown here. I understand they are not a statutory determination."
        onClose={() => setConfirm(null)}
        onConfirm={confirmAction}
        body={
          <div className="space-y-2">
            <p>Net salaries {formatRand(totals.net)}. Employer contributions {formatRand(totals.employerContributions)}. Employer payroll cost {formatRand(totals.employerCost)}.</p>
            <IllustrativeBanner />
          </div>
        }
      />
    </div>
  );
}

function LineStep({
  title,
  kind,
  people,
  note,
  emphasis = false,
}: {
  title: string;
  kind: "earning" | "employee_deduction" | "employer_contribution";
  people: ReturnType<typeof runEmployees>;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? "bg-teal-50/40" : undefined}>
      <CardTitle title={title} description={note} />
      <div className="divide-y divide-line">
        {people.map((employee) => {
          const group = linesOf(employee.lines, kind);
          const total = group.reduce((sum, line) => sum + line.amount, 0);
          return (
            <div key={employee.id} className="py-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{fullName(employee)}</span>
                <span className="num">{formatRand(total)}</span>
              </div>
              {group.length === 0 ? <p className="text-xs text-muted">No lines.</p> : null}
              <ul className="mt-1">
                {group.map((line) => (
                  <li key={line.id} className="flex justify-between text-sm text-muted">
                    <span>
                      {line.label}
                      {line.note ? " · sample" : ""}
                    </span>
                    <span className="num">{formatRand(line.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
