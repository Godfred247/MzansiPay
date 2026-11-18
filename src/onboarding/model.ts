import { round2 } from "../format.ts";

export type AccountKind = "employer" | "accountant";
export type Frequency = "monthly" | "weekly" | "fortnightly";
export type PayGroup = "earning" | "deduction" | "employer";

export const SAMPLE_PAYE = "PAYE-SAMPLE";
export const SAMPLE_UIF = "UIF-SAMPLE";
export const SAMPLE_SDL = "SDL-SAMPLE";
export const SAMPLE_VAT = "VAT-SAMPLE";
export const VERIFY_CODE = "482913";
export const MFA_CODE = "204816";
export const DEMO_CARD = "0000000000000000";
export const DEMO_EXPIRY = "12/28";
export const DEMO_CVC = "000";

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export const INDUSTRIES = ["Food manufacturing", "Retail", "Professional services", "Hospitality", "Logistics", "Other"];

export interface PersonDraft {
  firstName: string;
  lastName: string;
  email: string;
  accountKind: AccountKind | "";
  emailVerified: boolean;
  mfaMethod: "" | "app" | "sms";
  mfaEnabled: boolean;
  signupComplete: boolean;
}

export interface EmployerDraft {
  tradingName: string;
  legalName: string;
  industry: string;
  employeeBand: string;
  role: string;
  registrationNumber: string;
  vatChoice: "" | "registered" | "not-registered";
  vatReference: string;
  payeReference: string;
  uifReference: string;
  sdlChoice: "" | "registered" | "not-registered";
  sdlReference: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  payrollEmail: string;
  frequencies: Frequency[];
  firstFrequency: Frequency | "";
  periodStart: string;
  periodEnd: string;
  payDate: string;
  planId: string;
  registered: boolean;
}

export interface TeamSeat {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AccountantDraft {
  practiceType: string;
  clientBand: string;
  role: string;
  practiceName: string;
  legalName: string;
  registrationNumber: string;
  bodyReference: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  team: TeamSeat[];
  planId: string;
  registered: boolean;
}

export interface EmployeeDraft {
  declined: boolean;
  accepted: boolean;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  emailVerified: boolean;
  passwordSet: boolean;
  mfaEnabled: boolean;
  preferredName: string;
  confirmed: boolean;
}

export interface BranchDraft {
  id: string;
  name: string;
  city: string;
  departments: string[];
}

export interface CustomCode {
  id: string;
  name: string;
  group: PayGroup;
}

export interface WizardDraft {
  companyTrading: string;
  companyLegal: string;
  industry: string;
  payeReference: string;
  uifReference: string;
  sdlChoice: "" | "registered" | "not-registered";
  sdlReference: string;
  branches: BranchDraft[];
  frequencies: Frequency[];
  monthlyPayDay: string;
  weeklyPayDay: string;
  fortnightlyAnchor: string;
  yearStartMonth: string;
  annualLeaveDays: string;
  sickLeaveDays: string;
  familyLeaveDays: string;
  leaveNotes: string;
  codes: string[];
  customCodes: CustomCode[];
  admins: TeamSeat[];
  savedAt: string;
  completed: boolean;
}

export interface OnboardingState {
  version: 1;
  person: PersonDraft;
  employer: EmployerDraft;
  accountant: AccountantDraft;
  employee: EmployeeDraft;
  wizard: WizardDraft;
  done: {
    employer: string[];
    accountant: string[];
    employee: string[];
    wizard: string[];
  };
}

export interface StepLink {
  id: string;
  label: string;
  href: string;
}

export const EMPLOYER_STEPS: StepLink[] = [
  { id: "organisation", label: "Organisation", href: "/start/employer/organisation" },
  { id: "company", label: "Company information", href: "/start/employer/company" },
  { id: "registration", label: "Registration details", href: "/start/employer/registration" },
  { id: "statutory", label: "PAYE, UIF and SDL", href: "/start/employer/statutory" },
  { id: "address", label: "Address and contact", href: "/start/employer/address" },
  { id: "frequencies", label: "Payroll frequencies", href: "/start/employer/frequencies" },
  { id: "period", label: "First payroll period", href: "/start/employer/period" },
  { id: "plan", label: "Subscription plan", href: "/start/employer/plan" },
  { id: "checkout", label: "Checkout", href: "/start/employer/checkout" },
  { id: "confirmed", label: "Confirmation", href: "/start/employer/confirmed" },
  { id: "welcome", label: "Introduction", href: "/start/employer/welcome" },
];

export const ACCOUNTANT_STEPS: StepLink[] = [
  { id: "profile", label: "Practice profile", href: "/start/accountant/practice" },
  { id: "registration", label: "Name and registration", href: "/start/accountant/registration" },
  { id: "contact", label: "Contact details", href: "/start/accountant/contact" },
  { id: "team", label: "Team setup", href: "/start/accountant/team" },
  { id: "plan", label: "Subscription", href: "/start/accountant/plan" },
  { id: "checkout", label: "Checkout", href: "/start/accountant/checkout" },
  { id: "welcome", label: "Introduction", href: "/start/accountant/welcome" },
];

export const EMPLOYEE_STEPS: StepLink[] = [
  { id: "accept", label: "Accept invitation", href: "/invite/accept" },
  { id: "account", label: "Account", href: "/invite/account" },
  { id: "verify", label: "Email verification", href: "/invite/verify" },
  { id: "password", label: "Password", href: "/invite/password" },
  { id: "mfa", label: "MFA", href: "/invite/mfa" },
  { id: "profile", label: "Review profile", href: "/invite/profile" },
  { id: "confirm", label: "Confirm details", href: "/invite/confirm" },
  { id: "welcome", label: "Introduction", href: "/invite/welcome" },
];

export const WIZARD_STEPS: StepLink[] = [
  { id: "company", label: "Company details", href: "/setup/company" },
  { id: "tax", label: "Tax registration", href: "/setup/tax" },
  { id: "branches", label: "Branches and departments", href: "/setup/branches" },
  { id: "frequency", label: "Payroll frequency", href: "/setup/frequency" },
  { id: "pay-dates", label: "Pay dates", href: "/setup/pay-dates" },
  { id: "year", label: "Financial year", href: "/setup/year" },
  { id: "leave", label: "Leave policy", href: "/setup/leave" },
  { id: "earnings", label: "Earnings and deductions", href: "/setup/earnings" },
  { id: "admins", label: "Payroll administrators", href: "/setup/admins" },
  { id: "review", label: "Final review", href: "/setup/review" },
];

export const STARTER_CODES: { id: string; name: string; group: PayGroup; note: string }[] = [
  { id: "basic", name: "Basic salary", group: "earning", note: "Employee earning." },
  { id: "overtime", name: "Overtime", group: "earning", note: "Employee earning. Hours are entered on the payroll run." },
  { id: "paye", name: "PAYE", group: "deduction", note: "Employee deduction. The amount is entered later. This is not a tax table." },
  { id: "uif", name: "UIF employee", group: "deduction", note: "Employee deduction." },
  { id: "pension-ee", name: "Retirement fund employee", group: "deduction", note: "Employee deduction." },
  { id: "uif-er", name: "UIF employer", group: "employer", note: "Employer contribution. It is not deducted from net salary." },
  { id: "sdl", name: "SDL", group: "employer", note: "Employer contribution where the organisation is registered for SDL." },
  { id: "pension-er", name: "Retirement fund employer", group: "employer", note: "Employer contribution." },
];

export const INVITE = {
  company: "Khanyisa Retail (Pty) Ltd",
  trading: "Khanyisa Retail",
  from: "people@khanyisa-retail.example",
  employeeNumber: "KH-0142",
  firstName: "Boitumelo",
  lastName: "Khumalo",
  email: "boitumelo.khumalo@khanyisa-retail.example",
  title: "Warehouse supervisor",
  department: "Operations",
  branch: "Sandton",
  frequency: "Monthly",
  start: "2026-12-01",
  annualLeave: "15 days",
  sickLeave: "30 days over 36 months",
  familyLeave: "3 days",
};

export function emptyEmployer(): EmployerDraft {
  return {
    tradingName: "",
    legalName: "",
    industry: "",
    employeeBand: "",
    role: "",
    registrationNumber: "",
    vatChoice: "",
    vatReference: "",
    payeReference: "",
    uifReference: "",
    sdlChoice: "",
    sdlReference: "",
    street: "",
    suburb: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    payrollEmail: "",
    frequencies: [],
    firstFrequency: "",
    periodStart: "",
    periodEnd: "",
    payDate: "",
    planId: "",
    registered: false,
  };
}

export function emptyOnboarding(): OnboardingState {
  return {
    version: 1,
    person: {
      firstName: "",
      lastName: "",
      email: "",
      accountKind: "",
      emailVerified: false,
      mfaMethod: "",
      mfaEnabled: false,
      signupComplete: false,
    },
    employer: emptyEmployer(),
    accountant: {
      practiceType: "",
      clientBand: "",
      role: "",
      practiceName: "",
      legalName: "",
      registrationNumber: "",
      bodyReference: "",
      street: "",
      suburb: "",
      city: "",
      province: "",
      postalCode: "",
      phone: "",
      email: "",
      team: [],
      planId: "",
      registered: false,
    },
    employee: {
      declined: false,
      accepted: false,
      firstName: INVITE.firstName,
      lastName: INVITE.lastName,
      email: INVITE.email,
      mobile: "",
      emailVerified: false,
      passwordSet: false,
      mfaEnabled: false,
      preferredName: "",
      confirmed: false,
    },
    wizard: {
      companyTrading: "",
      companyLegal: "",
      industry: "",
      payeReference: "",
      uifReference: "",
      sdlChoice: "",
      sdlReference: "",
      branches: [],
      frequencies: [],
      monthlyPayDay: "",
      weeklyPayDay: "",
      fortnightlyAnchor: "",
      yearStartMonth: "",
      annualLeaveDays: "",
      sickLeaveDays: "",
      familyLeaveDays: "",
      leaveNotes: "",
      codes: [],
      customCodes: [],
      admins: [],
      savedAt: "",
      completed: false,
    },
    done: { employer: [], accountant: [], employee: [], wizard: [] },
  };
}

export function lethaboEmployer(): EmployerDraft {
  return {
    tradingName: "Lethabo Foods",
    legalName: "Lethabo Foods (Pty) Ltd",
    industry: "Food manufacturing",
    employeeBand: "16–80",
    role: "Payroll administrator",
    registrationNumber: "2021/441902/07",
    vatChoice: "registered",
    vatReference: SAMPLE_VAT,
    payeReference: SAMPLE_PAYE,
    uifReference: SAMPLE_UIF,
    sdlChoice: "registered",
    sdlReference: SAMPLE_SDL,
    street: "12 Cedar Works",
    suburb: "Eco Park",
    city: "Centurion",
    province: "Gauteng",
    postalCode: "0157",
    phone: "0120000140",
    payrollEmail: "payroll@lethabo-foods.example",
    frequencies: ["monthly", "weekly"],
    firstFrequency: "monthly",
    periodStart: "2026-11-01",
    periodEnd: "2026-11-30",
    payDate: "2026-11-25",
    planId: "business",
    registered: false,
  };
}

export function sebokaAccountant(): Pick<
  AccountantDraft,
  "practiceType" | "clientBand" | "role" | "practiceName" | "legalName" | "registrationNumber" | "bodyReference" | "street" | "suburb" | "city" | "province" | "postalCode" | "phone" | "email" | "planId"
> {
  return {
    practiceType: "Payroll bureau",
    clientBand: "1–25",
    role: "Payroll practitioner",
    practiceName: "Seboka Advisory",
    legalName: "Seboka Advisory (Pty) Ltd",
    registrationNumber: "2016/118204/07",
    bodyReference: "PR-SAMPLE",
    street: "8 Sample Chambers",
    suburb: "Rosebank",
    city: "Johannesburg",
    province: "Gauteng",
    postalCode: "2196",
    phone: "0110000194",
    email: "hello@seboka-advisory.example",
    planId: "practice",
  };
}

export function vatSplit(total: number): { exVat: number; vat: number; total: number } {
  const exVat = round2(total / 1.15);
  const vat = round2(total - exVat);
  return { exVat, vat, total };
}

for (const price of [499, 1499, 3200, 3900, 7500]) {
  const split = vatSplit(price);
  if (round2(split.exVat + split.vat) !== price) throw new Error(`VAT split failed for ${price}`);
}

export function frequencyLabel(value: Frequency): string {
  if (value === "monthly") return "Monthly";
  if (value === "weekly") return "Weekly";
  return "Fortnightly";
}

export function groupLabel(group: PayGroup): string {
  if (group === "earning") return "Employee earning";
  if (group === "deduction") return "Employee deduction";
  return "Employer contribution";
}
