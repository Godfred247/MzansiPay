export type OrgId = "khanyisa" | "moloto";
export type Frequency = "monthly" | "fortnightly" | "weekly";
export type LineKind = "earning" | "employee_deduction" | "employer_contribution";
export type RunStatus = "scheduled" | "draft" | "in_review" | "approved" | "paid";
export type LeaveType = "Annual" | "Sick" | "Family responsibility" | "Maternity";
export type LeaveStatus = "pending" | "approved" | "declined";
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "teal";

export const CODES = {
  basic: "BASIC",
  overtime: "OT",
  commission: "COMM",
  travel: "TRAVEL",
  shift: "SHIFT",
  paye: "PAYE",
  uif: "UIF",
  pension: "PENS",
  medical: "MED",
  loan: "LOAN",
  union: "UNION",
  uifEr: "UIF-ER",
  sdl: "SDL",
  pensionEr: "PENS-ER",
  medicalEr: "MED-ER",
} as const;

export interface PayLine {
  id: string;
  code: string;
  label: string;
  kind: LineKind;
  amount: number;
  note?: string;
}

export interface Employee {
  id: string;
  orgId: OrgId;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  site: string;
  frequency: Frequency;
  status: "active" | "on_leave" | "terminated";
  startDate: string;
  endDate?: string;
  email: string;
  mobile: string;
  idMasked: string;
  taxMasked: string;
  bank: string;
  accountType: string;
  accountMasked: string;
  manager: string;
  leave: { annual: number; sick: number; family: number };
  taxableSample: number;
  lines: PayLine[];
  expectedNet: number;
}

export interface HistoryPayslip {
  id: string;
  employeeId: string;
  periodLabel: string;
  start: string;
  end: string;
  payDate: string;
  gross: number;
  paye: number;
  uif: number;
  otherDeductions: number;
  net: number;
  employerContributions: number;
}

export interface PayrollRun {
  id: string;
  orgId: OrgId;
  frequency: Frequency;
  name: string;
  start: string;
  end: string;
  payDate: string;
  status: RunStatus;
  calculated: boolean;
  preparedBy: string;
  employeeIds: string[];
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PaymentBatch {
  id: string;
  orgId: OrgId;
  runId?: string;
  name: string;
  payDate: string;
  amount: number;
  employees: number;
  status: "blocked" | "ready" | "released" | "failed" | "paid";
  accountName: string;
  accountMasked: string;
  reference: string;
  failure?: string;
}

export interface LeaveRequest {
  id: string;
  orgId: OrgId;
  employeeId: string;
  type: LeaveType;
  start: string;
  end: string;
  days: number;
  status: LeaveStatus;
  note: string;
  decisionNote?: string;
}

export interface PayCode {
  id: string;
  orgId: OrgId;
  code: string;
  label: string;
  kind: LineKind;
  active: boolean;
  description: string;
}

export interface DocItem {
  id: string;
  orgId: OrgId;
  owner: "company" | string;
  name: string;
  category: string;
  updated: string;
  sensitivity: "standard" | "restricted";
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  orgId?: OrgId;
}

export interface Notice {
  id: string;
  audience: "employer" | "accountant" | "employee";
  title: string;
  body: string;
  time: string;
  href: string;
  unread: boolean;
}

export interface OrgProfile {
  id: OrgId;
  tradingName: string;
  legalName: string;
  registration: string;
  paye: string;
  uif: string;
  sdl: string;
  coida: string;
  address: string[];
  email: string;
  phone: string;
  planId: string;
  nextPlanId?: string;
  cancelOn?: string;
  frequencies: Frequency[];
  payDay: string;
}

export interface OrgUser {
  id: string;
  orgId: OrgId;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited";
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited";
}

export interface ClientAccount {
  id: string;
  tradingName: string;
  legalName: string;
  city: string;
  employeesLabel: string;
  access: "authorised" | "pending";
  workspace: boolean;
  assignee: string;
  summary: string;
  since: string;
  control?: { gross: number; net: number; paye: number; employerCost: number };
  blocked?: string;
}

export interface CalendarEvent {
  date: string;
  title: string;
  client: string;
  tone: "default" | "warning" | "info";
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  audience: string;
  points: string[];
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  exVat: number;
  vat: number;
  total: number;
  status: "Paid";
}

export interface Totals {
  gross: number;
  employeeDeductions: number;
  net: number;
  employerContributions: number;
  employerCost: number;
}

export interface PayslipModel {
  id: string;
  employee: Employee;
  periodLabel: string;
  start: string;
  end: string;
  payDate: string;
  statusLabel: string;
  lines: PayLine[];
  taxable?: number;
  final: boolean;
  runId?: string;
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

export function frequencyLabel(frequency: Frequency): string {
  if (frequency === "monthly") return "Monthly";
  if (frequency === "weekly") return "Weekly";
  return "Fortnightly";
}

export function sumLines(lines: PayLine[]): Totals {
  const gross = lines.filter((line) => line.kind === "earning").reduce((sum, line) => sum + line.amount, 0);
  const employeeDeductions = lines
    .filter((line) => line.kind === "employee_deduction")
    .reduce((sum, line) => sum + line.amount, 0);
  const employerContributions = lines
    .filter((line) => line.kind === "employer_contribution")
    .reduce((sum, line) => sum + line.amount, 0);
  return {
    gross,
    employeeDeductions,
    net: gross - employeeDeductions,
    employerContributions,
    employerCost: gross + employerContributions,
  };
}

export function sumTotals(list: Totals[]): Totals {
  return list.reduce(
    (acc, item) => ({
      gross: acc.gross + item.gross,
      employeeDeductions: acc.employeeDeductions + item.employeeDeductions,
      net: acc.net + item.net,
      employerContributions: acc.employerContributions + item.employerContributions,
      employerCost: acc.employerCost + item.employerCost,
    }),
    { gross: 0, employeeDeductions: 0, net: 0, employerContributions: 0, employerCost: 0 },
  );
}

export function linesOf(lines: PayLine[], kind: LineKind): PayLine[] {
  return lines.filter((line) => line.kind === kind);
}

export function sumCode(lines: PayLine[], code: string): number {
  return lines.filter((line) => line.code === code).reduce((sum, line) => sum + line.amount, 0);
}

export function runStatusMeta(status: RunStatus): { label: string; tone: BadgeTone } {
  switch (status) {
    case "scheduled":
      return { label: "Scheduled", tone: "neutral" };
    case "draft":
      return { label: "Draft", tone: "info" };
    case "in_review":
      return { label: "In review", tone: "warning" };
    case "approved":
      return { label: "Approved", tone: "teal" };
    case "paid":
      return { label: "Paid", tone: "success" };
  }
}

export function paymentStatusMeta(status: PaymentBatch["status"]): { label: string; tone: BadgeTone } {
  switch (status) {
    case "blocked":
      return { label: "Waiting for approval", tone: "neutral" };
    case "ready":
      return { label: "Ready to release", tone: "warning" };
    case "released":
      return { label: "Released", tone: "teal" };
    case "failed":
      return { label: "Failed", tone: "danger" };
    case "paid":
      return { label: "Paid", tone: "success" };
  }
}

export function leaveTone(status: LeaveStatus): BadgeTone {
  if (status === "approved") return "success";
  if (status === "declined") return "danger";
  return "warning";
}

export function runEmployees(run: PayrollRun, employees: Employee[]): Employee[] {
  return run.employeeIds
    .map((id) => employees.find((employee) => employee.id === id))
    .filter((employee): employee is Employee => Boolean(employee));
}

export function runTotals(run: PayrollRun, employees: Employee[]): Totals {
  if (!run.calculated) {
    return { gross: 0, employeeDeductions: 0, net: 0, employerContributions: 0, employerCost: 0 };
  }
  return sumTotals(runEmployees(run, employees).map((employee) => sumLines(employee.lines)));
}

export function kindLabel(kind: LineKind): string {
  if (kind === "earning") return "Earning";
  if (kind === "employee_deduction") return "Employee deduction";
  return "Employer contribution";
}

function historyLines(item: HistoryPayslip): PayLine[] {
  const lines: PayLine[] = [
    {
      id: `${item.id}-basic`,
      code: CODES.basic,
      label: "Basic salary",
      kind: "earning",
      amount: item.gross,
    },
    {
      id: `${item.id}-paye`,
      code: CODES.paye,
      label: "PAYE",
      kind: "employee_deduction",
      amount: item.paye,
      note: "Sample amount carried from the stored payslip. Not a statutory determination.",
    },
    {
      id: `${item.id}-uif`,
      code: CODES.uif,
      label: "UIF",
      kind: "employee_deduction",
      amount: item.uif,
      note: "Sample amount carried from the stored payslip. Not a statutory determination.",
    },
  ];
  if (item.otherDeductions > 0) {
    lines.push({
      id: `${item.id}-other`,
      code: "OTHER",
      label: "Other employee deductions",
      kind: "employee_deduction",
      amount: item.otherDeductions,
    });
  }
  if (item.employerContributions > 0) {
    lines.push({
      id: `${item.id}-er`,
      code: "ER",
      label: "Employer contributions",
      kind: "employer_contribution",
      amount: item.employerContributions,
      note: "Stored sample total. Not deducted from net salary.",
    });
  }
  return lines;
}

export function payslipCatalogue(
  employees: Employee[],
  runs: PayrollRun[],
  history: HistoryPayslip[],
): PayslipModel[] {
  const slips: PayslipModel[] = [];
  for (const run of runs) {
    if (!run.calculated) continue;
    for (const employee of runEmployees(run, employees)) {
      slips.push({
        id: `ps-${run.id}-${employee.id}`,
        employee,
        periodLabel: run.name,
        start: run.start,
        end: run.end,
        payDate: run.payDate,
        statusLabel: runStatusMeta(run.status).label,
        lines: employee.lines,
        taxable: employee.taxableSample > 0 ? employee.taxableSample : undefined,
        final: run.status === "paid",
        runId: run.id,
      });
    }
  }
  for (const item of history) {
    const employee = employees.find((person) => person.id === item.employeeId);
    if (!employee) continue;
    slips.push({
      id: `ps-hist-${item.id}`,
      employee,
      periodLabel: item.periodLabel,
      start: item.start,
      end: item.end,
      payDate: item.payDate,
      statusLabel: "Paid",
      lines: historyLines(item),
      final: true,
    });
  }
  return slips.sort((a, b) => (a.payDate < b.payDate ? 1 : -1));
}

export function byDepartment(employees: Employee[]): { department: string; count: number; totals: Totals }[] {
  const groups = new Map<string, Employee[]>();
  for (const employee of employees) {
    const list = groups.get(employee.department) ?? [];
    list.push(employee);
    groups.set(employee.department, list);
  }
  return [...groups.entries()].map(([department, list]) => ({
    department,
    count: list.length,
    totals: sumTotals(list.map((employee) => sumLines(employee.lines))),
  }));
}
