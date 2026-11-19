import { useSyncExternalStore } from "react";

export type ProfileField = "mobile" | "address" | "emergency" | "bank";
export type RequestStatus = "pending" | "approved" | "declined";

export interface ProfileRequest {
  id: string;
  field: ProfileField;
  label: string;
  current: string;
  requested: string;
  status: RequestStatus;
  response?: string;
}

export interface CorrectionRequest {
  id: string;
  period: string;
  explanation: string;
  attachment: string;
  status: "submitted" | "responded";
  response?: string;
}

export interface EmployeeNotice {
  id: string;
  title: string;
  body: string;
  href: string;
  unread: boolean;
}

interface Desk {
  address: string;
  emergency: string;
  profileRequests: ProfileRequest[];
  corrections: CorrectionRequest[];
  notices: EmployeeNotice[];
}

let desk: Desk = {
  address: "14 Grayston Drive, Sandton",
  emergency: "Lindiwe Nkosi · sister · 082 000 0143",
  profileRequests: [],
  corrections: [],
  notices: [
    { id: "n-slip", title: "Payslip available", body: "Your November 2026 payslip can be opened. It is in review and is not final.", href: "/me/payslips", unread: true },
    { id: "n-leave", title: "Leave approved", body: "Annual leave on 26 and 27 Nov 2026 was approved.", href: "/me/leave", unread: true },
    { id: "n-announce", title: "Employer announcement", body: "The expected pay date for November is 25 Nov 2026. Payment follows approval.", href: "/me", unread: false },
  ],
};

const listeners = new Set<() => void>();

function replace(next: Desk) {
  desk = next;
  listeners.forEach((listener) => listener());
}

export function useEmployeeDesk(): Desk {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => desk,
  );
}

function notify(notice: EmployeeNotice) {
  return [notice, ...desk.notices];
}

export function submitProfileRequest(request: ProfileRequest) {
  replace({ ...desk, profileRequests: [request, ...desk.profileRequests] });
}

export function decideProfileRequest(id: string, status: "approved" | "declined", response: string) {
  const request = desk.profileRequests.find((item) => item.id === id);
  if (!request || request.status !== "pending") return;
  const next = { ...request, status, response };
  const address = request.field === "address" && status === "approved" ? request.requested : desk.address;
  const emergency = request.field === "emergency" && status === "approved" ? request.requested : desk.emergency;
  replace({
    ...desk,
    address,
    emergency,
    profileRequests: desk.profileRequests.map((item) => (item.id === id ? next : item)),
    notices: notify({
      id: `n-${id}`,
      title: "Personal information update",
      body: status === "approved" ? `${request.label} was approved. ${response}` : `${request.label} was declined. ${response}`,
      href: "/me/profile",
      unread: true,
    }),
  });
}

export function submitCorrection(request: CorrectionRequest) {
  replace({
    ...desk,
    corrections: [request, ...desk.corrections],
    notices: notify({ id: `n-${request.id}`, title: "Correction request sent", body: `${request.period} was sent to payroll. Your payslip was not changed.`, href: "/me/corrections", unread: true }),
  });
}

export function respondCorrection(id: string, response: string) {
  const request = desk.corrections.find((item) => item.id === id);
  if (!request || request.status === "responded") return;
  replace({
    ...desk,
    corrections: desk.corrections.map((item) => (item.id === id ? { ...item, status: "responded", response } : item)),
    notices: notify({ id: `n-reply-${id}`, title: "Payroll correction response", body: response, href: "/me/corrections", unread: true }),
  });
}

export function markNoticesRead() {
  replace({ ...desk, notices: desk.notices.map((notice) => ({ ...notice, unread: false })) });
}
