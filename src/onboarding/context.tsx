import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  emptyOnboarding,
  type AccountantDraft,
  type EmployeeDraft,
  type EmployerDraft,
  type OnboardingState,
  type PersonDraft,
  type WizardDraft,
} from "./model.ts";

const STORAGE_KEY = "mzansipay-onboarding-v1";

type Journey = keyof OnboardingState["done"];

interface OnboardingApi {
  state: OnboardingState;
  patchPerson: (partial: Partial<PersonDraft>) => void;
  patchEmployer: (partial: Partial<EmployerDraft>) => void;
  patchAccountant: (partial: Partial<AccountantDraft>) => void;
  patchEmployee: (partial: Partial<EmployeeDraft>) => void;
  patchWizard: (partial: Partial<WizardDraft>) => void;
  markDone: (journey: Journey, stepId: string) => void;
}

const OnboardingContext = createContext<OnboardingApi | null>(null);

function mergeState(saved: Partial<OnboardingState> | null): OnboardingState {
  const empty = emptyOnboarding();
  if (!saved || saved.version !== 1) return empty;
  return {
    ...empty,
    ...saved,
    person: { ...empty.person, ...saved.person },
    employer: { ...empty.employer, ...saved.employer, frequencies: saved.employer?.frequencies ?? [] },
    accountant: { ...empty.accountant, ...saved.accountant, team: saved.accountant?.team ?? [] },
    employee: { ...empty.employee, ...saved.employee },
    wizard: {
      ...empty.wizard,
      ...saved.wizard,
      branches: saved.wizard?.branches ?? [],
      frequencies: saved.wizard?.frequencies ?? [],
      codes: saved.wizard?.codes ?? [],
      customCodes: saved.wizard?.customCodes ?? [],
      admins: saved.wizard?.admins ?? [],
    },
    done: {
      employer: saved.done?.employer ?? [],
      accountant: saved.done?.accountant ?? [],
      employee: saved.done?.employee ?? [],
      wizard: saved.done?.wizard ?? [],
    },
  };
}

function readState(): OnboardingState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return mergeState(raw ? (JSON.parse(raw) as Partial<OnboardingState>) : null);
  } catch {
    return emptyOnboarding();
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(readState);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The draft stays in memory when the browser refuses storage.
    }
  }, [state]);

  const patchPerson = useCallback((partial: Partial<PersonDraft>) => {
    setState((current) => ({ ...current, person: { ...current.person, ...partial } }));
  }, []);
  const patchEmployer = useCallback((partial: Partial<EmployerDraft>) => {
    setState((current) => ({ ...current, employer: { ...current.employer, ...partial } }));
  }, []);
  const patchAccountant = useCallback((partial: Partial<AccountantDraft>) => {
    setState((current) => ({ ...current, accountant: { ...current.accountant, ...partial } }));
  }, []);
  const patchEmployee = useCallback((partial: Partial<EmployeeDraft>) => {
    setState((current) => ({ ...current, employee: { ...current.employee, ...partial } }));
  }, []);
  const patchWizard = useCallback((partial: Partial<WizardDraft>) => {
    setState((current) => ({
      ...current,
      wizard: { ...current.wizard, ...partial, savedAt: new Date().toISOString() },
    }));
  }, []);
  const markDone = useCallback((journey: Journey, stepId: string) => {
    setState((current) => {
      if (current.done[journey].includes(stepId)) return current;
      return { ...current, done: { ...current.done, [journey]: [...current.done[journey], stepId] } };
    });
  }, []);

  return (
    <OnboardingContext.Provider value={{ state, patchPerson, patchEmployer, patchAccountant, patchEmployee, patchWizard, markDone }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingApi {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
