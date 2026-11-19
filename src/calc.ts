import type { Employee, PayrollRun } from "./domain.ts";
import { CODES, fullName, sumCode, sumLines } from "./domain.ts";
import { HISTORY } from "./sample.ts";

/** A review marker for the demonstration. It is not the national minimum wage. */
export const WEEKLY_REVIEW_MARKER = 3500;
/** A review marker for overtime samples. It is not a statutory overtime rule. */
export const OVERTIME_REVIEW_MARKER = 1500;

export interface Figure {
  id: string;
  label: string;
  amount: number;
  emphasis?: "net" | "total";
  explanation: string;
}

export function employeeFigures(employee: Employee): Figure[] {
  const lines = employee.lines;
  const totals = sumLines(lines);
  const basic = sumCode(lines, CODES.basic);
  const overtime = sumCode(lines, CODES.overtime);
  const commission = sumCode(lines, CODES.commission);
  const allowances = sumCode(lines, CODES.travel) + sumCode(lines, CODES.shift);
  const paye = sumCode(lines, CODES.paye);
  const uif = sumCode(lines, CODES.uif);
  const uifEmployer = sumCode(lines, CODES.uifEr);
  const sdl = sumCode(lines, CODES.sdl);
  const otherDeductions = totals.employeeDeductions - paye - uif;
  const otherEmployer = totals.employerContributions - uifEmployer - sdl;
  const otherDeductionNames = lines.filter((line) => line.kind === "employee_deduction" && line.code !== CODES.paye && line.code !== CODES.uif).map((line) => line.label);
  const otherEmployerNames = lines.filter((line) => line.kind === "employer_contribution" && line.code !== CODES.uifEr && line.code !== CODES.sdl).map((line) => line.label);
  return [
    { id: "basic", label: "Basic salary", amount: basic, explanation: "The basic salary line stored on this employee. It is not derived from a tax table." },
    { id: "ordinary", label: "Ordinary earnings", amount: basic, explanation: "Ordinary earnings are shown equal to basic salary because this sample has no separate ordinary-hours line. Gross earnings does not add this row a second time." },
    { id: "overtime", label: "Overtime", amount: overtime, explanation: overtime > 0 ? "The overtime earning stored on this employee. No overtime rate is applied on this screen." : "No overtime line is stored. Zero is a placeholder, not a calculated overtime payment." },
    { id: "bonus", label: "Bonuses", amount: 0, explanation: "No bonus line is stored. Zero is a placeholder, not a bonus calculation." },
    { id: "commission", label: "Commissions", amount: commission, explanation: commission > 0 ? "The commission earning stored on this employee." : "No commission line is stored." },
    { id: "allowances", label: "Allowances", amount: allowances, explanation: allowances > 0 ? "Travel and shift allowance lines stored on this employee, added together for this row." : "No travel or shift allowance is stored." },
    { id: "benefits", label: "Taxable benefits", amount: 0, explanation: "No taxable benefit sample is stored. Zero holds the row. It is not a fringe-benefit calculation." },
    { id: "gross", label: "Gross earnings", amount: totals.gross, emphasis: "total", explanation: "The sum of earning lines: basic salary, overtime, commission and allowances. Ordinary earnings are not added again. Taxable benefits are not in this total." },
    { id: "taxable", label: "Taxable remuneration", amount: employee.taxableSample, explanation: employee.taxableSample > 0 ? "A taxable earnings sample stored on the employee. It is not calculated from the lines on this screen." : "No taxable earnings sample is stored." },
    { id: "paye", label: "PAYE", amount: paye, explanation: "The PAYE sample stored as an employee deduction. It is not a determination of tax." },
    { id: "uif", label: "UIF employee contribution", amount: uif, explanation: "The employee UIF sample stored as a deduction. It is not a UIF contribution calculation." },
    { id: "other-deductions", label: "Other deductions", amount: otherDeductions, explanation: otherDeductionNames.length ? `Employee deductions other than PAYE and UIF: ${otherDeductionNames.join(", ")}.` : "No other employee deduction is stored." },
    { id: "net", label: "Net pay", amount: totals.net, emphasis: "net", explanation: "Gross earnings minus employee deductions. Employer contributions are not subtracted here." },
    { id: "uif-er", label: "UIF employer contribution", amount: uifEmployer, explanation: "The employer UIF sample. It is a cost of the employer and does not reduce net pay." },
    { id: "sdl", label: "SDL employer contribution", amount: sdl, explanation: "The SDL sample stored as an employer contribution. It does not reduce net pay." },
    { id: "other-er", label: "Other employer contributions", amount: otherEmployer, explanation: otherEmployerNames.length ? `Employer contributions other than UIF and SDL: ${otherEmployerNames.join(", ")}.` : "No other employer contribution is stored." },
    { id: "cost", label: "Total employer cost", amount: totals.employerCost, emphasis: "total", explanation: "Gross earnings plus every employer contribution. It is not the amount paid to the employee." },
  ];
}

export function statutoryFrom(employees: Employee[]) {
  const lines = employees.flatMap((employee) => employee.lines);
  const paye = sumCode(lines, CODES.paye);
  const uifEmployee = sumCode(lines, CODES.uif);
  const uifEmployer = sumCode(lines, CODES.uifEr);
  const sdl = sumCode(lines, CODES.sdl);
  return {
    paye,
    uifEmployee,
    uifEmployer,
    uifTogether: uifEmployee + uifEmployer,
    sdl,
    eti: 0,
    worksheet: paye + uifEmployee + uifEmployer + sdl,
  };
}

export function octoberHistory(employees: Employee[]) {
  const slips = HISTORY.filter((item) => item.periodLabel.startsWith("October") && employees.some((employee) => employee.id === item.employeeId));
  return {
    slips,
    paye: slips.reduce((sum, item) => sum + item.paye, 0),
    uifEmployee: slips.reduce((sum, item) => sum + item.uif, 0),
  };
}

export type FindingKind = "salary_anomaly" | "minimum_wage_marker" | "missing_employee" | "missing_tax" | "invalid_bank" | "negative_net" | "duplicate";

export interface Finding {
  id: string;
  severity: "blocking" | "warning";
  kind: FindingKind;
  employeeId?: string;
  title: string;
  detail: string;
}

export function payrollFindings(employees: Employee[], runs: PayrollRun[]): Finding[] {
  const findings: Finding[] = [];
  const activeRuns = runs.filter((run) => run.calculated || run.status !== "scheduled");
  const seen = new Map<string, string>();
  for (const run of activeRuns) {
    const ids = new Set<string>();
    for (const employeeId of run.employeeIds) {
      if (ids.has(employeeId)) {
        const person = employees.find((employee) => employee.id === employeeId);
        findings.push({
          id: `dup-run-${run.id}-${employeeId}`,
          severity: "blocking",
          kind: "duplicate",
          employeeId,
          title: "Duplicate on one run",
          detail: `${person ? fullName(person) : "An employee"} is listed twice on ${run.name}.`,
        });
      }
      ids.add(employeeId);
      const prior = seen.get(employeeId);
      if (prior && prior !== run.id) {
        const person = employees.find((employee) => employee.id === employeeId);
        const other = runs.find((item) => item.id === prior);
        findings.push({
          id: `dup-period-${employeeId}`,
          severity: "warning",
          kind: "duplicate",
          employeeId,
          title: "Employee on more than one open run",
          detail: `${person ? fullName(person) : "An employee"} is on ${other?.name ?? "another run"} and ${run.name}.`,
        });
      } else {
        seen.set(employeeId, run.id);
      }
    }
  }

  for (const employee of employees) {
    const totals = sumLines(employee.lines);
    if (employee.lines.length === 0) continue;
    if (totals.net < 0) {
      findings.push({
        id: `negative-${employee.id}`,
        severity: "blocking",
        kind: "negative_net",
        employeeId: employee.id,
        title: "Negative net pay",
        detail: `${fullName(employee)} has a net pay sample of a negative amount. The lines were not changed.`,
      });
    }
    if (employee.taxMasked.toLowerCase().includes("not")) {
      findings.push({
        id: `tax-${employee.id}`,
        severity: "blocking",
        kind: "missing_tax",
        employeeId: employee.id,
        title: "Missing tax reference",
        detail: `${fullName(employee)} has no tax reference on file. The value stays masked when it is captured.`,
      });
    }
    if (employee.accountMasked.toLowerCase().includes("not") || employee.bank.trim().length < 2) {
      findings.push({
        id: `bank-${employee.id}`,
        severity: "blocking",
        kind: "invalid_bank",
        employeeId: employee.id,
        title: "Bank account not on file",
        detail: `${fullName(employee)} cannot be included in a payment file until a masked account is stored.`,
      });
    }
    if (!employee.email.includes("@") || employee.mobile.trim().length < 8) {
      findings.push({
        id: `info-${employee.id}`,
        severity: "warning",
        kind: "missing_employee",
        employeeId: employee.id,
        title: "Missing contact details",
        detail: `${fullName(employee)} is missing a work email or a mobile number.`,
      });
    }
    const overtime = sumCode(employee.lines, CODES.overtime);
    if (overtime >= OVERTIME_REVIEW_MARKER) {
      findings.push({
        id: `ot-${employee.id}`,
        severity: "warning",
        kind: "salary_anomaly",
        employeeId: employee.id,
        title: "Overtime above the review marker",
        detail: `${fullName(employee)} has an overtime sample at or above the demonstration marker. The marker is not a statutory overtime rule.`,
      });
    }
    const october = HISTORY.find((item) => item.employeeId === employee.id && item.periodLabel.startsWith("October"));
    const commission = sumCode(employee.lines, CODES.commission);
    if (commission > 0 && october && october.gross + commission <= totals.gross) {
      findings.push({
        id: `comm-${employee.id}`,
        severity: "warning",
        kind: "salary_anomaly",
        employeeId: employee.id,
        title: "Commission not in the previous payslip",
        detail: `${fullName(employee)} has a commission sample this period. The October stored gross did not include a separate commission figure.`,
      });
    }
    if (employee.frequency === "weekly" && totals.gross > 0 && totals.gross < WEEKLY_REVIEW_MARKER) {
      findings.push({
        id: `wage-${employee.id}`,
        severity: "warning",
        kind: "minimum_wage_marker",
        employeeId: employee.id,
        title: "Below the weekly review marker",
        detail: `${fullName(employee)} has a weekly gross sample under the demonstration marker. The marker is not the national minimum wage.`,
      });
    }
  }
  return findings;
}

export const FINDING_LABEL: Record<FindingKind, string> = {
  salary_anomaly: "Salary anomaly",
  minimum_wage_marker: "Minimum wage warning",
  missing_employee: "Missing employee information",
  missing_tax: "Missing tax reference",
  invalid_bank: "Invalid bank information",
  negative_net: "Negative net pay",
  duplicate: "Duplicate payroll",
};
