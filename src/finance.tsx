import { useState } from "react";
import { Link } from "react-router-dom";
import type { Employee, PayLine, PayslipModel } from "./domain.ts";
import { fullName, linesOf, sumLines, sumTotals } from "./domain.ts";
import { ILLUSTRATIVE, formatDateShort, formatRand } from "./format.ts";
import { cn } from "./ui.tsx";

export function IllustrativeBanner() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">{ILLUSTRATIVE}</div>
  );
}

export function PayrollStatement({ lines, taxable, compact = false }: { lines: PayLine[]; taxable?: number; compact?: boolean }) {
  const totals = sumLines(lines);
  const cells = [
    { label: "Gross earnings", value: totals.gross, hint: "Sum of earning lines", tone: "default" as const },
    { label: "Employee deductions", value: totals.employeeDeductions, hint: "Withheld from employees", tone: "default" as const },
    { label: "Net salaries", value: totals.net, hint: "Gross minus deductions", tone: "net" as const },
    { label: "Employer contributions", value: totals.employerContributions, hint: "Paid by the employer", tone: "employer" as const },
    { label: "Employer payroll cost", value: totals.employerCost, hint: "Gross plus contributions", tone: "net" as const },
  ];
  return (
    <div>
      <IllustrativeBanner />
      <div className={cn("mt-3 grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-5")}>
        {cells.map((cell) => (
          <div
            key={cell.label}
            className={cn("rounded-xl border px-3 py-3", cell.tone === "employer" ? "border-teal-100 bg-teal-50" : "border-line bg-white")}
          >
            <p className="text-xs font-medium text-muted">{cell.label}</p>
            <p className={cn("num mt-1 text-lg font-semibold", cell.tone === "default" ? "text-ink" : "text-teal-700")}>{formatRand(cell.value)}</p>
            <p className="mt-1 text-xs text-muted">{cell.hint}</p>
          </div>
        ))}
      </div>
      {taxable !== undefined ? (
        <p className="mt-3 text-sm text-ink">
          Taxable earnings (sample) <span className="num font-semibold">{formatRand(taxable)}</span>
          <span className="text-muted"> · a stored sample, not a calculation of taxable remuneration.</span>
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-muted">
        Net salary is gross earnings minus employee deductions. Employer contributions sit beside net salary and are not deducted from it.
      </p>
      <CalculationNote />
    </div>
  );
}

export function CalculationNote() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button type="button" className="text-sm font-medium text-blue-700" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "Hide how these figures are assembled" : "How these figures are assembled"}
      </button>
      {open ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
          <li>Gross earnings is the sum of earning lines on the payslip or run.</li>
          <li>Employee deductions, including the sample PAYE and UIF lines, are withheld from the employee.</li>
          <li>Net salary is gross earnings minus employee deductions.</li>
          <li>Employer contributions, including sample UIF, SDL and benefit contributions, are costs of the employer.</li>
          <li>Employer payroll cost is gross earnings plus employer contributions.</li>
          <li>PAYE, UIF and SDL amounts are illustrative samples. They are not a determination under tax, UIF or skills development law.</li>
        </ul>
      ) : null}
    </div>
  );
}

export function EmployeeBreakdown({
  employees,
  employeeHref,
}: {
  employees: Employee[];
  employeeHref?: (employeeId: string) => string;
}) {
  const rows = employees.map((employee) => ({ employee, totals: sumLines(employee.lines) }));
  const totals = sumTotals(rows.map((row) => row.totals));
  const taxableComplete = employees.length > 0 && employees.every((employee) => employee.taxableSample > 0);
  const taxableTotal = employees.reduce((sum, employee) => sum + employee.taxableSample, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-sm">
        <thead className="text-left text-xs tracking-wide text-muted uppercase">
          <tr className="border-b border-line">
            <th className="py-2 pr-3 font-medium">Employee</th>
            <th className="py-2 pr-3 text-right font-medium">Gross earnings</th>
            <th className="py-2 pr-3 text-right font-medium">Taxable earnings (sample)</th>
            <th className="py-2 pr-3 text-right font-medium">Employee deductions</th>
            <th className="py-2 pr-3 text-right font-medium">Net salary</th>
            <th className="py-2 pr-3 text-right font-medium">Employer contributions</th>
            <th className="py-2 text-right font-medium">Employer cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ employee, totals: row }) => (
            <tr key={employee.id} className="border-b border-line">
              <td className="py-2.5 pr-3">
                {employeeHref ? (
                  <Link className="font-medium text-blue-700" to={employeeHref(employee.id)}>
                    {fullName(employee)}
                  </Link>
                ) : (
                  <span className="font-medium">{fullName(employee)}</span>
                )}
                <div className="text-xs text-muted">{employee.employeeNumber}</div>
              </td>
              <td className="num py-2.5 pr-3 text-right">{formatRand(row.gross)}</td>
              <td className="num py-2.5 pr-3 text-right">{employee.taxableSample > 0 ? formatRand(employee.taxableSample) : "Not supplied"}</td>
              <td className="num py-2.5 pr-3 text-right">{formatRand(row.employeeDeductions)}</td>
              <td className="num py-2.5 pr-3 text-right font-medium text-teal-700">{formatRand(row.net)}</td>
              <td className="num py-2.5 pr-3 text-right">{formatRand(row.employerContributions)}</td>
              <td className="num py-2.5 text-right">{formatRand(row.employerCost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="py-3 pr-3">Total</td>
            <td className="num py-3 pr-3 text-right">{formatRand(totals.gross)}</td>
            <td className="num py-3 pr-3 text-right">{taxableComplete ? formatRand(taxableTotal) : "—"}</td>
            <td className="num py-3 pr-3 text-right">{formatRand(totals.employeeDeductions)}</td>
            <td className="num py-3 pr-3 text-right text-teal-700">{formatRand(totals.net)}</td>
            <td className="num py-3 pr-3 text-right">{formatRand(totals.employerContributions)}</td>
            <td className="num py-3 text-right">{formatRand(totals.employerCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function LineGroup({ title, lines, totalLabel, emphasis = false }: { title: string; lines: PayLine[]; totalLabel: string; emphasis?: boolean }) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return (
    <div className={cn(emphasis && "rounded-xl bg-teal-50 p-4")}>
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {emphasis ? <p className="mt-1 text-xs text-teal-800">Paid by the employer. Not deducted from net salary.</p> : null}
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No lines in this group.</p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-line/80">
                <td className="py-2 pr-3">
                  <span>{line.label}</span>
                  <span className="ml-2 text-xs text-muted">{line.code}</span>
                  {line.note ? <span className="mt-0.5 block text-xs text-muted">{line.note}</span> : null}
                </td>
                <td className="num py-2 text-right align-top">{formatRand(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="py-2 pr-3 text-left text-sm font-semibold">{totalLabel}</th>
              <td className="num py-2 text-right font-semibold">{formatRand(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export function PayslipPaper({
  slip,
  companyName,
  companyMeta,
}: {
  slip: PayslipModel;
  companyName: string;
  companyMeta: string;
}) {
  const totals = sumLines(slip.lines);
  return (
    <article className="print-area mx-auto max-w-3xl rounded-xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">MzansiPay payslip</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{companyName}</h2>
          <p className="text-sm text-muted">{companyMeta}</p>
        </div>
        <div className="text-sm text-muted sm:text-right">
          <p className="font-medium text-ink">{slip.periodLabel}</p>
          <p>
            {formatDateShort(slip.start)} – {formatDateShort(slip.end)}
          </p>
          <p>Pay date {formatDateShort(slip.payDate)}</p>
          <p className="mt-1 font-medium text-ink">{slip.final ? slip.statusLabel : `${slip.statusLabel} · Not final`}</p>
        </div>
      </header>
      <div className="mt-4">
        <IllustrativeBanner />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted uppercase">Employee</dt>
          <dd className="font-medium">{fullName(slip.employee)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Employee number</dt>
          <dd>{slip.employee.employeeNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Job title</dt>
          <dd>{slip.employee.jobTitle}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Identity number</dt>
          <dd>{slip.employee.idMasked}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Tax reference</dt>
          <dd>{slip.employee.taxMasked}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">Bank account</dt>
          <dd>
            {slip.employee.bank} · {slip.employee.accountMasked}
          </dd>
        </div>
      </dl>
      <div className="mt-6 space-y-5">
        <LineGroup title="Earnings" lines={linesOf(slip.lines, "earning")} totalLabel="Gross earnings" />
        <LineGroup title="Employee deductions" lines={linesOf(slip.lines, "employee_deduction")} totalLabel="Total employee deductions" />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-navy px-4 py-3 text-white">
        <div>
          <p className="text-xs text-white/70">Net salary</p>
          <p className="text-xs text-white/70">Paid to the employee</p>
        </div>
        <p className="num text-2xl font-semibold">{formatRand(totals.net)}</p>
      </div>
      <div className="mt-4">
        <LineGroup
          title="Employer contributions"
          lines={linesOf(slip.lines, "employer_contribution")}
          totalLabel="Total employer contributions"
          emphasis
        />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-teal-100 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium">Total employer payroll cost</p>
          <p className="text-xs text-muted">Gross earnings plus employer contributions</p>
        </div>
        <p className="num text-xl font-semibold text-teal-700">{formatRand(totals.employerCost)}</p>
      </div>
      {slip.taxable !== undefined ? (
        <p className="mt-4 text-sm text-muted">
          Taxable earnings (sample) <span className="num text-ink">{formatRand(slip.taxable)}</span>. This figure is stored for the layout. It is not a tax calculation.
        </p>
      ) : null}
      <p className="mt-4 text-xs leading-5 text-muted">{ILLUSTRATIVE}</p>
    </article>
  );
}
