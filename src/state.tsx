import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type {
  DocItem,
  Employee,
  LeaveRequest,
  LeaveType,
  OrgId,
  PayCode,
  TeamMember,
} from "./domain.ts";
import { runEmployees, sumLines, sumTotals } from "./domain.ts";
import { uid } from "./format.ts";
import {
  AUDIT,
  CODES_SEED,
  DOCUMENTS,
  EMPLOYEES,
  LEAVE,
  NOTICES,
  ORGS,
  PAYMENTS,
  RUNS,
  TEAM,
  USERS,
} from "./sample.ts";
import type { AuditEvent, Notice, OrgProfile, OrgUser, PaymentBatch, PayrollRun } from "./domain.ts";

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

export interface State {
  orgId: OrgId;
  orgs: Record<OrgId, OrgProfile>;
  employees: Employee[];
  runs: PayrollRun[];
  payments: PaymentBatch[];
  leave: LeaveRequest[];
  codes: PayCode[];
  documents: DocItem[];
  audit: AuditEvent[];
  notices: Notice[];
  toasts: Toast[];
  users: OrgUser[];
  team: TeamMember[];
  practicePlanId: string;
  practiceNextPlanId?: string;
  practiceCancelOn?: string;
  accountantAccess: Record<OrgId, boolean>;
  twoFactor: boolean;
}

type Action =
  | { type: "set-org"; orgId: OrgId }
  | { type: "approve-run"; runId: string; actor: string }
  | { type: "reopen-run"; runId: string; actor: string }
  | { type: "submit-run"; runId: string; actor: string }
  | { type: "calculate-run"; runId: string; actor: string }
  | { type: "create-moloto-run"; actor: string }
  | { type: "release-payment"; paymentId: string; actor: string }
  | { type: "retry-payment"; paymentId: string; actor: string }
  | { type: "decide-leave"; id: string; decision: "approved" | "declined"; note: string; actor: string }
  | { type: "add-leave"; request: LeaveRequest; actor: string }
  | { type: "add-employee"; employee: Employee; actor: string }
  | { type: "terminate-employee"; employeeId: string; endDate: string; reason: string; actor: string }
  | { type: "add-code"; code: PayCode; actor: string }
  | { type: "deactivate-code"; id: string; actor: string }
  | { type: "add-user"; user: OrgUser; actor: string }
  | { type: "add-team"; member: TeamMember; actor: string }
  | { type: "set-next-plan"; orgId: OrgId; planId: string; actor: string }
  | { type: "cancel-org"; orgId: OrgId; actor: string }
  | { type: "set-practice-plan"; planId: string; actor: string }
  | { type: "cancel-practice"; actor: string }
  | { type: "set-two-factor"; enabled: boolean; actor: string }
  | { type: "set-reference"; orgId: OrgId; field: "paye" | "uif" | "sdl" | "coida"; value: string; actor: string }
  | { type: "revoke-access"; orgId: OrgId; actor: string }
  | { type: "restore-access"; orgId: OrgId; actor: string }
  | { type: "add-document"; document: DocItem; actor: string }
  | { type: "protected-view"; employeeName: string; actor: string; orgId: OrgId }
  | { type: "mark-notices"; audience: Notice["audience"] }
  | { type: "dismiss-toast"; id: string };

function init(): State {
  return {
    orgId: "khanyisa",
    orgs: structuredClone(ORGS),
    employees: structuredClone(EMPLOYEES),
    runs: structuredClone(RUNS),
    payments: structuredClone(PAYMENTS),
    leave: structuredClone(LEAVE),
    codes: structuredClone(CODES_SEED),
    documents: structuredClone(DOCUMENTS),
    audit: structuredClone(AUDIT),
    notices: structuredClone(NOTICES),
    toasts: [],
    users: structuredClone(USERS),
    team: structuredClone(TEAM),
    practicePlanId: "practice",
    accountantAccess: { khanyisa: true, moloto: true },
    twoFactor: true,
  };
}

function note(
  state: State,
  message: string,
  event: Omit<AuditEvent, "id" | "at">,
  tone: Toast["tone"] = "success",
): State {
  return {
    ...state,
    audit: [{ ...event, id: uid("audit"), at: new Date().toISOString() }, ...state.audit],
    toasts: [...state.toasts, { id: uid("toast"), message, tone }].slice(-3),
  };
}

function leaveKey(type: LeaveType): "annual" | "sick" | "family" | null {
  if (type === "Annual") return "annual";
  if (type === "Sick") return "sick";
  if (type === "Family responsibility") return "family";
  return null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set-org":
      return { ...state, orgId: action.orgId };
    case "dismiss-toast":
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    case "mark-notices":
      return {
        ...state,
        notices: state.notices.map((item) =>
          item.audience === action.audience ? { ...item, unread: false } : item,
        ),
      };
    case "approve-run": {
      const run = state.runs.find((item) => item.id === action.runId);
      if (!run || run.status !== "in_review") return state;
      const people = runEmployees(run, state.employees);
      const totals = sumTotals(people.map((employee) => sumLines(employee.lines)));
      return note(
        {
          ...state,
          runs: state.runs.map((item) =>
            item.id === run.id
              ? { ...item, status: "approved", approvedBy: action.actor, approvedAt: new Date().toISOString() }
              : item,
          ),
          payments: state.payments.map((payment) =>
            payment.runId === run.id && payment.status === "blocked"
              ? { ...payment, status: "ready", amount: totals.net, employees: people.length }
              : payment,
          ),
        },
        "Payroll approved. The payment batch can now be released.",
        {
          actor: action.actor,
          action: "Approved payroll",
          detail: `${run.name} approved. Net salaries ${totals.net.toFixed(2)}. Employer cost ${totals.employerCost.toFixed(2)}.`,
          orgId: run.orgId,
        },
      );
    }
    case "reopen-run": {
      const run = state.runs.find((item) => item.id === action.runId);
      const payment = state.payments.find((item) => item.runId === action.runId);
      if (!run || (run.status !== "approved" && run.status !== "in_review")) return state;
      if (payment && (payment.status === "released" || payment.status === "paid")) return state;
      return note(
        {
          ...state,
          runs: state.runs.map((item) =>
            item.id === run.id ? { ...item, status: "draft", approvedBy: undefined, approvedAt: undefined } : item,
          ),
          payments: state.payments.map((item) =>
            item.runId === run.id && item.status === "ready" ? { ...item, status: "blocked" } : item,
          ),
        },
        "Payroll returned to draft.",
        { actor: action.actor, action: "Reopened payroll", detail: `${run.name} returned to draft.`, orgId: run.orgId },
      );
    }
    case "submit-run": {
      const run = state.runs.find((item) => item.id === action.runId);
      if (!run || run.status !== "draft" || !run.calculated) return state;
      return note(
        {
          ...state,
          runs: state.runs.map((item) =>
            item.id === run.id ? { ...item, status: "in_review", submittedAt: new Date().toISOString() } : item,
          ),
        },
        "Payroll submitted for employer approval.",
        { actor: action.actor, action: "Submitted payroll", detail: `${run.name} submitted for approval.`, orgId: run.orgId },
      );
    }
    case "calculate-run": {
      const run = state.runs.find((item) => item.id === action.runId);
      if (!run || run.calculated) return state;
      const people = runEmployees(run, state.employees);
      const totals = sumTotals(people.map((employee) => sumLines(employee.lines)));
      const payment: PaymentBatch = {
        id: uid("pay"),
        orgId: run.orgId,
        runId: run.id,
        name: run.name,
        payDate: run.payDate,
        amount: totals.net,
        employees: people.length,
        status: "blocked",
        accountName: state.orgs[run.orgId].legalName,
        accountMasked: "FNB ••••2290",
        reference: "SAL2026W47",
      };
      return note(
        {
          ...state,
          runs: state.runs.map((item) =>
            item.id === run.id ? { ...item, calculated: true, status: "in_review", submittedAt: new Date().toISOString() } : item,
          ),
          payments: [...state.payments, payment],
        },
        "Sample payroll lines are now on the run. They are not a statutory calculation.",
        { actor: action.actor, action: "Prepared payroll", detail: `${run.name} marked in review with sample lines.`, orgId: run.orgId },
      );
    }
    case "create-moloto-run": {
      if (state.runs.some((run) => run.orgId === "moloto")) return state;
      const people = state.employees.filter((employee) => employee.orgId === "moloto" && employee.status !== "terminated");
      if (people.length === 0) return state;
      const totals = sumTotals(people.map((employee) => sumLines(employee.lines)));
      const run: PayrollRun = {
        id: "run-moloto-2026-11",
        orgId: "moloto",
        frequency: "monthly",
        name: "November 2026 monthly",
        start: "2026-11-01",
        end: "2026-11-30",
        payDate: "2026-11-30",
        status: "draft",
        calculated: true,
        preparedBy: action.actor,
        employeeIds: people.map((employee) => employee.id),
      };
      const payment: PaymentBatch = {
        id: "pay-moloto-2026-11",
        orgId: "moloto",
        runId: run.id,
        name: "November monthly salaries",
        payDate: run.payDate,
        amount: totals.net,
        employees: people.length,
        status: "blocked",
        accountName: "Moloto Studio (Pty) Ltd",
        accountMasked: "Not captured",
        reference: "SAL202611",
      };
      return note(
        { ...state, runs: [...state.runs, run], payments: [...state.payments, payment] },
        "November payroll opened in draft. No statutory lines were calculated.",
        { actor: action.actor, action: "Opened payroll", detail: "November 2026 monthly run opened for Moloto Studio.", orgId: "moloto" },
      );
    }
    case "release-payment": {
      const payment = state.payments.find((item) => item.id === action.paymentId);
      if (!payment || payment.status !== "ready") return state;
      return note(
        {
          ...state,
          payments: state.payments.map((item) => (item.id === payment.id ? { ...item, status: "released" } : item)),
          runs: state.runs.map((run) => (run.id === payment.runId ? { ...run, status: "paid" } : run)),
        },
        "Payment batch marked released in this demonstration. No money was sent.",
        {
          actor: action.actor,
          action: "Released payment",
          detail: `${payment.name} marked released. Reference ${payment.reference}.`,
          orgId: payment.orgId,
        },
      );
    }
    case "retry-payment": {
      const payment = state.payments.find((item) => item.id === action.paymentId);
      if (!payment || payment.status !== "failed") return state;
      return note(
        {
          ...state,
          payments: state.payments.map((item) =>
            item.id === payment.id ? { ...item, status: "ready", failure: undefined } : item,
          ),
        },
        "The failed batch is ready to release again. No payment has been sent.",
        { actor: action.actor, action: "Retried payment file", detail: `${payment.name} moved back to ready.`, orgId: payment.orgId },
        "info",
      );
    }
    case "decide-leave": {
      const request = state.leave.find((item) => item.id === action.id);
      if (!request || request.status !== "pending") return state;
      const key = leaveKey(request.type);
      return note(
        {
          ...state,
          leave: state.leave.map((item) =>
            item.id === request.id ? { ...item, status: action.decision, decisionNote: action.note } : item,
          ),
          employees: state.employees.map((employee) => {
            if (employee.id !== request.employeeId || action.decision !== "approved" || !key) return employee;
            return {
              ...employee,
              leave: { ...employee.leave, [key]: Math.max(0, employee.leave[key] - request.days) },
            };
          }),
        },
        action.decision === "approved" ? "Leave approved." : "Leave declined.",
        {
          actor: action.actor,
          action: action.decision === "approved" ? "Approved leave" : "Declined leave",
          detail: `${request.type} leave ${action.decision}. ${action.note}`,
          orgId: request.orgId,
        },
      );
    }
    case "add-leave":
      return note(
        { ...state, leave: [action.request, ...state.leave] },
        "Leave request submitted.",
        { actor: action.actor, action: "Requested leave", detail: action.request.note || "Leave request submitted.", orgId: action.request.orgId },
      );
    case "add-employee":
      return note(
        { ...state, employees: [...state.employees, action.employee] },
        `${action.employee.firstName} ${action.employee.lastName} added to the employee register.`,
        {
          actor: action.actor,
          action: "Added employee",
          detail: `${action.employee.firstName} ${action.employee.lastName} (${action.employee.employeeNumber}) added.`,
          orgId: action.employee.orgId,
        },
      );
    case "terminate-employee": {
      const employee = state.employees.find((item) => item.id === action.employeeId);
      if (!employee || employee.status === "terminated") return state;
      return note(
        {
          ...state,
          employees: state.employees.map((item) => (item.id === employee.id ? { ...item, status: "terminated", endDate: action.endDate } : item)),
        },
        `${employee.firstName} ${employee.lastName} is now on the archived register.`,
        { actor: action.actor, action: "Archived employee", detail: `${employee.firstName} ${employee.lastName}. ${action.reason}`, orgId: employee.orgId },
      );
    }
    case "add-code":
      return note(
        { ...state, codes: [...state.codes, action.code] },
        "Pay code added.",
        { actor: action.actor, action: "Added pay code", detail: `${action.code.code} · ${action.code.label}.`, orgId: action.code.orgId },
      );
    case "deactivate-code": {
      const code = state.codes.find((item) => item.id === action.id);
      if (!code || !code.active) return state;
      return note(
        { ...state, codes: state.codes.map((item) => (item.id === code.id ? { ...item, active: false } : item)) },
        "Pay code archived.",
        { actor: action.actor, action: "Archived pay code", detail: `${code.code} archived.`, orgId: code.orgId },
      );
    }
    case "add-user":
      return note(
        { ...state, users: [...state.users, action.user] },
        "Invitation recorded.",
        { actor: action.actor, action: "Invited user", detail: `${action.user.email} invited as ${action.user.role}.`, orgId: action.user.orgId },
      );
    case "add-team":
      return note(
        { ...state, team: [...state.team, action.member] },
        "Team invitation recorded.",
        { actor: action.actor, action: "Invited teammate", detail: `${action.member.email} invited as ${action.member.role}.` },
      );
    case "set-next-plan":
      return note(
        {
          ...state,
          orgs: {
            ...state.orgs,
            [action.orgId]: { ...state.orgs[action.orgId], nextPlanId: action.planId, cancelOn: undefined },
          },
        },
        "Plan change scheduled for 1 Dec 2026.",
        { actor: action.actor, action: "Scheduled plan change", detail: `Next plan set to ${action.planId}.`, orgId: action.orgId },
      );
    case "cancel-org":
      return note(
        {
          ...state,
          orgs: {
            ...state.orgs,
            [action.orgId]: { ...state.orgs[action.orgId], cancelOn: "2026-12-01", nextPlanId: undefined },
          },
        },
        "Subscription set to end on 1 Dec 2026. There is no free plan after that.",
        { actor: action.actor, action: "Scheduled cancellation", detail: "Subscription ends 1 Dec 2026.", orgId: action.orgId },
        "info",
      );
    case "set-practice-plan":
      return note(
        { ...state, practiceNextPlanId: action.planId, practiceCancelOn: undefined },
        "Practice plan change scheduled for 1 Dec 2026.",
        { actor: action.actor, action: "Scheduled practice plan", detail: `Next practice plan set to ${action.planId}.` },
      );
    case "cancel-practice":
      return note(
        { ...state, practiceCancelOn: "2026-12-01", practiceNextPlanId: undefined },
        "Practice subscription set to end on 1 Dec 2026.",
        { actor: action.actor, action: "Scheduled practice cancellation", detail: "Practice subscription ends 1 Dec 2026." },
        "info",
      );
    case "set-two-factor":
      return note(
        { ...state, twoFactor: action.enabled },
        action.enabled ? "Two-factor authentication is on." : "Two-factor authentication is off for this demonstration.",
        { actor: action.actor, action: "Updated security", detail: `Two-factor authentication ${action.enabled ? "on" : "off"}.` },
        action.enabled ? "success" : "info",
      );
    case "set-reference":
      return note(
        {
          ...state,
          orgs: {
            ...state.orgs,
            [action.orgId]: { ...state.orgs[action.orgId], [action.field]: action.value },
          },
        },
        "Reference stored in masked form.",
        { actor: action.actor, action: "Updated registration", detail: `${action.field.toUpperCase()} reference updated.`, orgId: action.orgId },
      );
    case "revoke-access":
      return note(
        { ...state, accountantAccess: { ...state.accountantAccess, [action.orgId]: false } },
        "Accountant access removed. Harbour & Co can no longer open this organisation.",
        { actor: action.actor, action: "Revoked accountant access", detail: "Harbour & Co access revoked.", orgId: action.orgId },
      );
    case "restore-access":
      return note(
        { ...state, accountantAccess: { ...state.accountantAccess, [action.orgId]: true } },
        "Accountant access restored for Harbour & Co.",
        { actor: action.actor, action: "Restored accountant access", detail: "Harbour & Co access restored.", orgId: action.orgId },
      );
    case "add-document":
      return note(
        { ...state, documents: [action.document, ...state.documents] },
        "Document recorded. The file stays in this demonstration session.",
        { actor: action.actor, action: "Added document", detail: action.document.name, orgId: action.document.orgId },
      );
    case "protected-view":
      return note(
        state,
        "The number stays masked. This request is in the audit history.",
        {
          actor: action.actor,
          action: "Protected field",
          detail: `Requested a full identity or tax number for ${action.employeeName}. The value stayed masked.`,
          orgId: action.orgId,
        },
        "info",
      );
    default: {
      const neverAction: never = action;
      return neverAction;
    }
  }
}

interface Store {
  state: State;
  dispatch: (action: Action) => void;
}

const Ctx = createContext<Store | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const timers = state.toasts.map((toast) =>
      window.setTimeout(() => dispatch({ type: "dismiss-toast", id: toast.id }), 4200),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [state.toasts]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useApp must be used inside AppStateProvider");
  return store;
}

export function useOrg() {
  const { state } = useApp();
  const org = state.orgs[state.orgId];
  return {
    org,
    orgId: state.orgId,
    employees: state.employees.filter((employee) => employee.orgId === state.orgId),
    runs: state.runs.filter((run) => run.orgId === state.orgId),
    payments: state.payments.filter((payment) => payment.orgId === state.orgId),
    leave: state.leave.filter((request) => request.orgId === state.orgId),
    codes: state.codes.filter((code) => code.orgId === state.orgId),
    documents: state.documents.filter((document) => document.orgId === state.orgId),
    users: state.users.filter((user) => user.orgId === state.orgId),
    audit: state.audit.filter((event) => !event.orgId || event.orgId === state.orgId),
  };
}
