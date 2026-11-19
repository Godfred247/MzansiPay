import { useSyncExternalStore } from "react";

interface ReviewState {
  notes: Record<string, string>;
  emp201Reviewed: boolean;
  certificateNotes: Record<string, string>;
  rules: Record<string, "draft" | "approved">;
}

let state: ReviewState = {
  notes: {},
  emp201Reviewed: false,
  certificateNotes: {},
  rules: { "2026-27": "draft" },
};

const listeners = new Set<() => void>();

function replace(next: ReviewState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function useReview(): ReviewState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export function noteFinding(id: string, note: string) {
  replace({ ...state, notes: { ...state.notes, [id]: note } });
}

export function reviewEmp201() {
  replace({ ...state, emp201Reviewed: true });
}

export function noteCertificate(employeeId: string, note: string) {
  replace({ ...state, certificateNotes: { ...state.certificateNotes, [employeeId]: note } });
}

export function approveRule(yearId: string) {
  replace({ ...state, rules: { ...state.rules, [yearId]: "approved" } });
}
