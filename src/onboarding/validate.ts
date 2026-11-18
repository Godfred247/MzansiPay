import { inclusiveDays } from "../format.ts";
import { SAMPLE_PAYE, SAMPLE_SDL, SAMPLE_UIF, SAMPLE_VAT, type EmployerDraft, type Frequency, type TeamSeat, type WizardDraft } from "./model.ts";

export function fieldErrors(pairs: Array<[string, string | undefined]>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, message] of pairs) {
    if (message) errors[key] = message;
  }
  return errors;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalisePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export function isSaPhone(value: string): boolean {
  return /^(\+27|0)\d{9}$/.test(normalisePhone(value));
}

export function passwordMessage(value: string): string | undefined {
  if (!value) return "Enter a password.";
  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Use at least 8 characters, with a letter and a number.";
  return undefined;
}

export function companyRegistrationMessage(value: string): string | undefined {
  if (!value.trim()) return "Enter the company registration number.";
  if (!/^\d{4}\/\d{6}\/\d{2}$/.test(value.trim())) return "Use the shape 2021/441902/07. This demonstration does not look the number up at CIPC.";
  return undefined;
}

export function sampleReferenceMessage(value: string, token: string, label: string): string | undefined {
  if (!value.trim()) return `Enter the ${label}.`;
  if (value.trim().toUpperCase() !== token) return `Use ${token}. A real ${label} is not accepted here.`;
  return undefined;
}

export function postalMessage(value: string): string | undefined {
  if (!/^\d{4}$/.test(value.trim())) return "Enter a 4-digit postal code.";
  return undefined;
}

export function phoneMessage(value: string): string | undefined {
  if (!isSaPhone(value)) return "Enter a South African number, such as 012 000 0140.";
  return undefined;
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function employerOrganisationErrors(draft: EmployerDraft): Record<string, string> {
  return fieldErrors([
    ["tradingName", draft.tradingName.trim() ? undefined : "Enter the trading name."],
    ["legalName", draft.legalName.trim() ? undefined : "Enter the registered company name."],
  ]);
}

export function employerCompanyErrors(draft: EmployerDraft): Record<string, string> {
  return fieldErrors([
    ["industry", draft.industry ? undefined : "Choose an industry."],
    ["employeeBand", draft.employeeBand ? undefined : "Choose an employee band."],
    ["role", draft.role ? undefined : "Choose your role."],
  ]);
}

export function employerRegistrationErrors(draft: EmployerDraft): Record<string, string> {
  return fieldErrors([
    ["registrationNumber", companyRegistrationMessage(draft.registrationNumber)],
    ["vatChoice", draft.vatChoice ? undefined : "Say whether the company is registered for VAT."],
    ["vatReference", draft.vatChoice === "registered" ? sampleReferenceMessage(draft.vatReference, SAMPLE_VAT, "VAT reference") : undefined],
  ]);
}

export function employerStatutoryErrors(draft: EmployerDraft): Record<string, string> {
  return fieldErrors([
    ["payeReference", sampleReferenceMessage(draft.payeReference, SAMPLE_PAYE, "PAYE reference")],
    ["uifReference", sampleReferenceMessage(draft.uifReference, SAMPLE_UIF, "UIF reference")],
    ["sdlChoice", draft.sdlChoice ? undefined : "Say whether the company is registered for SDL."],
    ["sdlReference", draft.sdlChoice === "registered" ? sampleReferenceMessage(draft.sdlReference, SAMPLE_SDL, "SDL reference") : undefined],
  ]);
}

export function employerAddressErrors(draft: EmployerDraft): Record<string, string> {
  return fieldErrors([
    ["street", draft.street.trim() ? undefined : "Enter the street address."],
    ["suburb", draft.suburb.trim() ? undefined : "Enter the suburb."],
    ["city", draft.city.trim() ? undefined : "Enter the city."],
    ["province", draft.province ? undefined : "Choose a province."],
    ["postalCode", postalMessage(draft.postalCode)],
    ["phone", phoneMessage(draft.phone)],
    ["payrollEmail", isEmail(draft.payrollEmail) ? undefined : "Enter a valid payroll email address."],
  ]);
}

export function employerFrequencyErrors(draft: EmployerDraft): Record<string, string> {
  return fieldErrors([["frequencies", draft.frequencies.length ? undefined : "Select at least one payroll frequency."]]);
}

export function employerPeriodErrors(draft: EmployerDraft): Record<string, string> {
  const errors = fieldErrors([
    ["firstFrequency", !draft.firstFrequency ? "Choose which cycle you will run first." : draft.frequencies.includes(draft.firstFrequency) ? undefined : "Choose one of the frequencies you selected."],
    ["periodStart", draft.periodStart ? undefined : "Enter the period start."],
    ["periodEnd", draft.periodEnd ? undefined : "Enter the period end."],
    ["payDate", draft.payDate ? undefined : "Enter the pay date."],
  ]);
  if (draft.periodStart && draft.periodEnd && draft.periodEnd < draft.periodStart) errors.periodEnd = "The period end is before the start.";
  if (!errors.periodEnd && draft.periodStart && draft.periodEnd && draft.firstFrequency && draft.frequencies.includes(draft.firstFrequency)) {
    const days = inclusiveDays(draft.periodStart, draft.periodEnd);
    if (draft.firstFrequency === "monthly" && (days < 28 || days > 31)) errors.periodEnd = "A monthly period in this form is 28 to 31 days.";
    if (draft.firstFrequency === "weekly" && days !== 7) errors.periodEnd = "A weekly period in this form is 7 days.";
    if (draft.firstFrequency === "fortnightly" && days !== 14) errors.periodEnd = "A fortnightly period in this form is 14 days.";
  }
  if (draft.payDate && draft.periodStart && draft.payDate < draft.periodStart) errors.payDate = "The pay date is before the period starts.";
  if (draft.payDate && draft.periodEnd && draft.periodEnd >= (draft.periodStart || draft.periodEnd) && draft.payDate > addDays(draft.periodEnd, 7)) {
    errors.payDate = "Keep the pay date within 7 days after the period ends.";
  }
  return errors;
}

export function seatErrors(seats: TeamSeat[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const seat of seats) {
    if (!seat.name.trim()) errors[`${seat.id}-name`] = "Enter a name.";
    if (!isEmail(seat.email)) errors[`${seat.id}-email`] = "Enter a valid email address.";
    if (!seat.role) errors[`${seat.id}-role`] = "Choose a role.";
  }
  return errors;
}

export function wizardCompanyErrors(draft: WizardDraft): Record<string, string> {
  return fieldErrors([
    ["companyTrading", draft.companyTrading.trim() ? undefined : "Enter the trading name."],
    ["companyLegal", draft.companyLegal.trim() ? undefined : "Enter the registered company name."],
    ["industry", draft.industry ? undefined : "Choose an industry."],
  ]);
}

export function wizardTaxErrors(draft: WizardDraft): Record<string, string> {
  return fieldErrors([
    ["payeReference", sampleReferenceMessage(draft.payeReference, SAMPLE_PAYE, "PAYE reference")],
    ["uifReference", sampleReferenceMessage(draft.uifReference, SAMPLE_UIF, "UIF reference")],
    ["sdlChoice", draft.sdlChoice ? undefined : "Say whether the company is registered for SDL."],
    ["sdlReference", draft.sdlChoice === "registered" ? sampleReferenceMessage(draft.sdlReference, SAMPLE_SDL, "SDL reference") : undefined],
  ]);
}

export function wizardBranchErrors(draft: WizardDraft): Record<string, string> {
  if (!draft.branches.length) return { branches: "Add at least one branch." };
  const errors: Record<string, string> = {};
  for (const branch of draft.branches) {
    if (!branch.name.trim()) errors[`${branch.id}-name`] = "Enter the branch name.";
    if (!branch.city.trim()) errors[`${branch.id}-city`] = "Enter the city.";
    if (!branch.departments.length) errors[`${branch.id}-departments`] = "Add at least one department.";
  }
  return errors;
}

export function wizardFrequencyErrors(draft: WizardDraft): Record<string, string> {
  return fieldErrors([["frequencies", draft.frequencies.length ? undefined : "Select at least one payroll frequency."]]);
}

export function wizardPayDateErrors(draft: WizardDraft): Record<string, string> {
  return fieldErrors([
    ["monthlyPayDay", draft.frequencies.includes("monthly") && !draft.monthlyPayDay ? "Choose the monthly pay day." : undefined],
    ["weeklyPayDay", draft.frequencies.includes("weekly") && !draft.weeklyPayDay ? "Choose the weekly pay day." : undefined],
    ["fortnightlyAnchor", draft.frequencies.includes("fortnightly") && !draft.fortnightlyAnchor ? "Enter the first Friday of the fortnightly cycle." : undefined],
  ]);
}

export function wizardYearErrors(draft: WizardDraft): Record<string, string> {
  return fieldErrors([["yearStartMonth", draft.yearStartMonth ? undefined : "Choose the month the financial year starts."]]);
}

function dayMessage(value: string, label: string, max: number): string | undefined {
  if (!/^\d+$/.test(value.trim())) return `Enter ${label} as a whole number of days.`;
  const days = Number(value);
  if (days < 1 || days > max) return `Enter ${label} between 1 and ${max} days.`;
  return undefined;
}

export function wizardLeaveErrors(draft: WizardDraft): Record<string, string> {
  return fieldErrors([
    ["annualLeaveDays", dayMessage(draft.annualLeaveDays, "annual leave", 40)],
    ["sickLeaveDays", dayMessage(draft.sickLeaveDays, "sick leave", 90)],
    ["familyLeaveDays", dayMessage(draft.familyLeaveDays, "family responsibility leave", 10)],
  ]);
}

export function wizardEarningErrors(draft: WizardDraft): Record<string, string> {
  const hasEarning = draft.codes.some((id) => id === "basic" || id === "overtime") || draft.customCodes.some((code) => code.group === "earning");
  const errors = fieldErrors([["codes", hasEarning ? undefined : "Keep at least one employee earning."]]);
  for (const code of draft.customCodes) {
    if (!code.name.trim()) errors[`${code.id}-name`] = "Enter a name for the pay code.";
  }
  return errors;
}

export function hasFrequency(list: Frequency[], value: Frequency): boolean {
  return list.includes(value);
}
