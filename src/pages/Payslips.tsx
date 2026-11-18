import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fullName, payslipCatalogue, sumLines } from "../domain.ts";
import { downloadText, formatDate, formatRand } from "../format.ts";
import { PayslipPaper } from "../finance.tsx";
import { HISTORY } from "../sample.ts";
import { useApp, useOrg } from "../state.tsx";
import { useShellLoading } from "../shells.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, ButtonLink, DataTable, EmptyState, ErrorState, Field, Input, PageHeader, Select } from "../ui.tsx";

export function PayslipsPage() {
  const loading = useShellLoading();
  const { employees, runs, org } = useOrg();
  const { state } = useApp();
  const { base } = useWorkspace();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const slips = payslipCatalogue(state.employees, runs, HISTORY).filter((slip) => slip.employee.orgId === org.id);
  const filtered = slips.filter((slip) => {
    const haystack = `${fullName(slip.employee)} ${slip.periodLabel}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (status === "final" && !slip.final) return false;
    if (status === "open" && slip.final) return false;
    return true;
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Payslips" description="Open a payslip to see earnings, employee deductions and employer contributions on separate sections." />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Search" htmlFor="payslip-search">
          <Input id="payslip-search" value={query} placeholder="Employee or period" onChange={(event) => setQuery(event.target.value)} />
        </Field>
        <Field label="Status" htmlFor="payslip-status">
          <Select id="payslip-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="open">Not final</option>
            <option value="final">Paid</option>
          </Select>
        </Field>
      </div>
      {employees.length === 0 ? (
        <EmptyState title="No payslips" body="Payslips are created from a calculated payroll run." />
      ) : (
        <DataTable
          rows={filtered}
          getId={(slip) => slip.id}
          loading={loading}
          resetKey={`${query}|${status}|${org.id}`}
          empty={<EmptyState title="No payslips match" body="Try another period or clear the status filter." />}
          columns={[
            {
              key: "employee",
              header: "Employee",
              sortValue: (slip) => fullName(slip.employee),
              render: (slip) => (
                <Link className="font-medium text-blue-700" to={`${base}/payslips/${slip.id}`}>
                  {fullName(slip.employee)}
                </Link>
              ),
            },
            { key: "period", header: "Period", sortValue: (slip) => slip.payDate, render: (slip) => slip.periodLabel },
            { key: "date", header: "Pay date", sortValue: (slip) => slip.payDate, render: (slip) => formatDate(slip.payDate) },
            {
              key: "status",
              header: "Status",
              render: (slip) => <Badge tone={slip.final ? "success" : "warning"}>{slip.final ? "Paid" : slip.statusLabel}</Badge>,
            },
            {
              key: "net",
              header: "Net salary",
              align: "right",
              sortValue: (slip) => sumLines(slip.lines).net,
              render: (slip) => <span className="num font-medium text-teal-700">{formatRand(sumLines(slip.lines).net)}</span>,
            },
          ]}
        />
      )}
    </div>
  );
}

export function PayslipPage() {
  const { payslipId } = useParams();
  const { runs, org } = useOrg();
  const { state } = useApp();
  const { base } = useWorkspace();
  const slip = payslipCatalogue(state.employees, state.runs.length ? state.runs : runs, HISTORY).find((item) => item.id === payslipId && item.employee.orgId === org.id);
  if (!slip) return <ErrorState title="Payslip not available" body="This payslip is not in the current organisation." />;
  const totals = sumLines(slip.lines);
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <ButtonLink to={`${base}/payslips`} variant="secondary">
          All payslips
        </ButtonLink>
        <Button
          variant="secondary"
          onClick={() =>
            downloadText(
              `${slip.employee.employeeNumber}-${slip.periodLabel}.txt`,
              `${org.legalName}\n${slip.periodLabel}\n${fullName(slip.employee)}\nNet salary ${formatRand(totals.net)}\nEmployer contributions ${formatRand(totals.employerContributions)}\nIllustrative sample. Not a statutory payslip.\n`,
            )
          }
        >
          Download sample
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
      </div>
      <PayslipPaper slip={slip} companyName={org.legalName} companyMeta={org.address.join(", ")} />
    </div>
  );
}
