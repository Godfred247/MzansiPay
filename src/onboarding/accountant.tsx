import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatRand, uid } from "../format.ts";
import { PRACTICE_PLANS } from "../sample.ts";
import { Button, ButtonLink, Field, Input, Select } from "../ui.tsx";
import { CheckoutSummary, cardErrors, emptyCard, type CardDraft } from "./checkout.tsx";
import { useOnboarding } from "./context.tsx";
import { ChoiceCard, FormAlert, FormSuccess, JourneyFrame, Note, PlanPicker } from "./frame.tsx";
import { ACCOUNTANT_STEPS, PROVINCES, sebokaAccountant, type AccountantDraft } from "./model.ts";
import { companyRegistrationMessage, fieldErrors, isEmail, phoneMessage, postalMessage, sampleReferenceMessage, seatErrors } from "./validate.ts";

function useAccountantStep(stepId: string) {
  const navigate = useNavigate();
  const api = useOnboarding();
  return {
    ...api,
    draft: api.state.accountant,
    done: api.state.done.accountant,
    complete(href: string) {
      api.markDone("accountant", stepId);
      navigate(href);
    },
  };
}

function Shell({
  stepId,
  title,
  description,
  backTo,
  onSubmit,
  submitLabel,
  busy,
  children,
}: {
  stepId: string;
  title: string;
  description: string;
  backTo?: string;
  onSubmit?: (event: FormEvent) => void;
  submitLabel?: string;
  busy?: boolean;
  children: ReactNode;
}) {
  const { done } = useAccountantStep(stepId);
  return (
    <JourneyFrame steps={ACCOUNTANT_STEPS} current={stepId} done={done} title={title} description={description} backTo={backTo} onSubmit={onSubmit} submitLabel={submitLabel} busy={busy}>
      {children}
    </JourneyFrame>
  );
}

function profileErrors(draft: AccountantDraft): Record<string, string> {
  return fieldErrors([
    ["practiceType", draft.practiceType ? undefined : "Choose the type of practice."],
    ["clientBand", draft.clientBand ? undefined : "Choose a client band."],
    ["role", draft.role ? undefined : "Choose your role."],
  ]);
}

function registrationErrors(draft: AccountantDraft): Record<string, string> {
  return fieldErrors([
    ["practiceName", draft.practiceName.trim() ? undefined : "Enter the practice name."],
    ["legalName", draft.legalName.trim() ? undefined : "Enter the registered name."],
    ["registrationNumber", companyRegistrationMessage(draft.registrationNumber)],
    ["bodyReference", draft.bodyReference.trim() ? sampleReferenceMessage(draft.bodyReference, "PR-SAMPLE", "professional body reference") : undefined],
  ]);
}

function contactErrors(draft: AccountantDraft): Record<string, string> {
  return fieldErrors([
    ["street", draft.street.trim() ? undefined : "Enter the street address."],
    ["suburb", draft.suburb.trim() ? undefined : "Enter the suburb."],
    ["city", draft.city.trim() ? undefined : "Enter the city."],
    ["province", draft.province ? undefined : "Choose a province."],
    ["postalCode", postalMessage(draft.postalCode)],
    ["phone", phoneMessage(draft.phone)],
    ["email", isEmail(draft.email) ? undefined : "Enter a valid practice email address."],
  ]);
}

export function AccountantProfilePage() {
  const { draft, patchAccountant, complete } = useAccountantStep("profile");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = profileErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/accountant/registration");
  }

  return (
    <Shell stepId="profile" title="Practice profile" description="Tell MzansiPay what kind of practice this is. Client files are added only after an employer authorises access." onSubmit={onSubmit}>
      <Note>Use the Seboka Advisory sample, or describe another fictional practice.</Note>
      <Button
        type="button"
        variant="secondary"
        onClick={() => patchAccountant(sebokaAccountant())}
      >
        Use the Seboka Advisory sample
      </Button>
      <fieldset>
        <legend className="text-sm font-medium">Practice type <span className="text-red-700">Required</span></legend>
        <div className="mt-3 grid gap-3">
          {["Accounting firm", "Payroll bureau", "Bookkeeping practice"].map((practiceType) => (
            <ChoiceCard key={practiceType} name="practice-type" checked={draft.practiceType === practiceType} title={practiceType} body="The label is for your team. It does not change statutory worksheets." onChange={() => patchAccountant({ practiceType })} />
          ))}
        </div>
        {errors.practiceType ? <p className="mt-2 text-sm text-red-700">{errors.practiceType}</p> : null}
      </fieldset>
      <Field label="Client files you expect" htmlFor="client-band" required error={errors.clientBand}>
        <Select id="client-band" value={draft.clientBand} invalid={Boolean(errors.clientBand)} onChange={(event) => patchAccountant({ clientBand: event.target.value })}>
          <option value="">Choose a band</option>
          <option>1–25</option>
          <option>26–80</option>
        </Select>
      </Field>
      <Field label="Your role" htmlFor="practice-role" required error={errors.role}>
        <Select id="practice-role" value={draft.role} invalid={Boolean(errors.role)} onChange={(event) => patchAccountant({ role: event.target.value })}>
          <option value="">Choose a role</option>
          <option>Partner</option>
          <option>Payroll practitioner</option>
          <option>Reviewer</option>
        </Select>
      </Field>
    </Shell>
  );
}

export function AccountantRegistrationPage() {
  const { draft, patchAccountant, complete } = useAccountantStep("registration");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = registrationErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/accountant/contact");
  }

  return (
    <Shell stepId="registration" title="Practice name and registration" description="The practice name is what employers see when they authorise access. The registration number is not checked against CIPC." backTo="/start/accountant/practice" onSubmit={onSubmit}>
      <Field label="Practice name" htmlFor="practice-name" required error={errors.practiceName}>
        <Input id="practice-name" value={draft.practiceName} invalid={Boolean(errors.practiceName)} onChange={(event) => patchAccountant({ practiceName: event.target.value })} />
      </Field>
      <Field label="Registered name" htmlFor="practice-legal" required error={errors.legalName}>
        <Input id="practice-legal" value={draft.legalName} invalid={Boolean(errors.legalName)} onChange={(event) => patchAccountant({ legalName: event.target.value })} />
      </Field>
      <Field label="Company registration number" htmlFor="practice-reg" required error={errors.registrationNumber} hint="Fictional sample: 2016/118204/07.">
        <Input id="practice-reg" value={draft.registrationNumber} invalid={Boolean(errors.registrationNumber)} onChange={(event) => patchAccountant({ registrationNumber: event.target.value })} />
      </Field>
      <Field label="Professional body reference" htmlFor="body-ref" error={errors.bodyReference} hint="Optional. If you enter one, use PR-SAMPLE. A real membership number is not accepted.">
        <Input id="body-ref" value={draft.bodyReference} invalid={Boolean(errors.bodyReference)} onChange={(event) => patchAccountant({ bodyReference: event.target.value })} />
      </Field>
    </Shell>
  );
}

export function AccountantContactPage() {
  const { draft, patchAccountant, complete } = useAccountantStep("contact");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = contactErrors(draft);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/accountant/team");
  }

  return (
    <Shell stepId="contact" title="Practice contact details" description="Employers use these details when they decide whether to authorise the practice." backTo="/start/accountant/registration" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Street address" htmlFor="a-street" required error={errors.street}>
          <Input id="a-street" value={draft.street} invalid={Boolean(errors.street)} onChange={(event) => patchAccountant({ street: event.target.value })} />
        </Field>
        <Field label="Suburb" htmlFor="a-suburb" required error={errors.suburb}>
          <Input id="a-suburb" value={draft.suburb} invalid={Boolean(errors.suburb)} onChange={(event) => patchAccountant({ suburb: event.target.value })} />
        </Field>
        <Field label="City" htmlFor="a-city" required error={errors.city}>
          <Input id="a-city" value={draft.city} invalid={Boolean(errors.city)} onChange={(event) => patchAccountant({ city: event.target.value })} />
        </Field>
        <Field label="Province" htmlFor="a-province" required error={errors.province}>
          <Select id="a-province" value={draft.province} invalid={Boolean(errors.province)} onChange={(event) => patchAccountant({ province: event.target.value })}>
            <option value="">Choose a province</option>
            {PROVINCES.map((province) => (
              <option key={province}>{province}</option>
            ))}
          </Select>
        </Field>
        <Field label="Postal code" htmlFor="a-postal" required error={errors.postalCode}>
          <Input id="a-postal" inputMode="numeric" value={draft.postalCode} invalid={Boolean(errors.postalCode)} onChange={(event) => patchAccountant({ postalCode: event.target.value })} />
        </Field>
        <Field label="Phone" htmlFor="a-phone" required error={errors.phone} hint="Such as 011 000 0194.">
          <Input id="a-phone" type="tel" value={draft.phone} invalid={Boolean(errors.phone)} onChange={(event) => patchAccountant({ phone: event.target.value })} />
        </Field>
      </div>
      <Field label="Practice email" htmlFor="a-email" required error={errors.email}>
        <Input id="a-email" type="email" value={draft.email} invalid={Boolean(errors.email)} onChange={(event) => patchAccountant({ email: event.target.value })} />
      </Field>
    </Shell>
  );
}

export function AccountantTeamPage() {
  const { state, draft, patchAccountant, complete } = useAccountantStep("team");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const owner = [state.person.firstName, state.person.lastName].filter(Boolean).join(" ") || "You";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = seatErrors(draft.team);
    setErrors(next);
    if (!Object.keys(next).length) complete("/start/accountant/plan");
  }

  return (
    <Shell stepId="team" title="Team setup" description="You are the first person on the practice. Invite colleagues when you are ready. Invitations are recorded here and are not emailed." backTo="/start/accountant/contact" onSubmit={onSubmit}>
      <div className="rounded-xl border border-line px-4 py-3 text-sm">
        <p className="font-semibold">{owner}</p>
        <p className="text-muted">{state.person.email || "Email not captured yet"} · {draft.role || "Practice owner"}</p>
      </div>
      {draft.team.length === 0 ? <Note>No colleagues have been added. You can continue with a one-person practice and invite the team later.</Note> : null}
      {draft.team.map((seat) => (
        <div key={seat.id} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
          <Field label="Name" htmlFor={`${seat.id}-name`} required error={errors[`${seat.id}-name`]}>
            <Input id={`${seat.id}-name`} value={seat.name} invalid={Boolean(errors[`${seat.id}-name`])} onChange={(event) => patchAccountant({ team: draft.team.map((item) => (item.id === seat.id ? { ...item, name: event.target.value } : item)) })} />
          </Field>
          <Field label="Work email" htmlFor={`${seat.id}-email`} required error={errors[`${seat.id}-email`]}>
            <Input id={`${seat.id}-email`} type="email" value={seat.email} invalid={Boolean(errors[`${seat.id}-email`])} onChange={(event) => patchAccountant({ team: draft.team.map((item) => (item.id === seat.id ? { ...item, email: event.target.value } : item)) })} />
          </Field>
          <Field label="Role" htmlFor={`${seat.id}-role`} required error={errors[`${seat.id}-role`]}>
            <Select id={`${seat.id}-role`} value={seat.role} onChange={(event) => patchAccountant({ team: draft.team.map((item) => (item.id === seat.id ? { ...item, role: event.target.value } : item)) })}>
              <option>Partner</option>
              <option>Payroll practitioner</option>
              <option>Reviewer</option>
              <option>Administrator</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="danger" onClick={() => patchAccountant({ team: draft.team.filter((item) => item.id !== seat.id) })}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => patchAccountant({ team: [...draft.team, { id: uid("seat"), name: "", email: "", role: "Payroll practitioner" }] })}>
        Add a team member
      </Button>
    </Shell>
  );
}

export function AccountantPlanPage() {
  const { draft, patchAccountant, complete } = useAccountantStep("plan");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.planId) {
      setError("Choose a paid practice plan. There is no free plan.");
      return;
    }
    complete("/start/accountant/checkout");
  }

  return (
    <Shell stepId="plan" title="Select a practice subscription" description="Prices include VAT at 15%. The plan covers the practice, not the employer’s own subscription." backTo="/start/accountant/team" onSubmit={onSubmit}>
      {draft.clientBand === "26–80" ? <Note>Practice Plus is listed for this client band. You can still choose Practice.</Note> : null}
      <PlanPicker plans={PRACTICE_PLANS} value={draft.planId} onChange={(planId) => patchAccountant({ planId })} columns="md:grid-cols-2" />
      <FormAlert message={error} />
    </Shell>
  );
}

export function AccountantCheckoutPage() {
  const { draft, patchAccountant, complete } = useAccountantStep("checkout");
  const [card, setCard] = useState<CardDraft>(emptyCard);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const plan = PRACTICE_PLANS.find((item) => item.id === draft.planId);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!plan) return;
    const next = cardErrors(card);
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    window.setTimeout(() => {
      patchAccountant({ registered: true });
      complete("/start/accountant/welcome");
    }, 700);
  }

  if (!plan) {
    return (
      <Shell stepId="checkout" title="Practice checkout" description="Checkout shows the practice plan and a demonstration card. No payment is taken." backTo="/start/accountant/plan" onSubmit={(event) => event.preventDefault()}>
        <FormAlert message="Choose a practice plan before checkout." />
        <ButtonLink to="/start/accountant/plan" variant="secondary">
          Back to plans
        </ButtonLink>
      </Shell>
    );
  }

  return (
    <Shell stepId="checkout" title="Practice checkout" description="Review the sample invoice and enter the demonstration card. No payment is taken." backTo="/start/accountant/plan" onSubmit={onSubmit} busy={busy} submitLabel={`Confirm ${formatRand(plan.price)}`}>
      <CheckoutSummary plan={plan} card={card} errors={errors} onChange={setCard} />
    </Shell>
  );
}

export function AccountantWelcomePage() {
  const { draft, done } = useAccountantStep("welcome");
  const plan = PRACTICE_PLANS.find((item) => item.id === draft.planId);
  const name = draft.practiceName || "Your practice";
  return (
    <JourneyFrame steps={ACCOUNTANT_STEPS} current="welcome" done={done} title="Practice introduction" description={`${name} is stored in this browser. The sample practice you can open is Harbour & Co, so the two records stay apart.`}>
      {draft.registered && plan ? <FormSuccess message={`${name} is on the ${plan.name} plan at ${formatRand(plan.price)} per month. No money was taken.`} /> : <FormAlert message="Checkout is not complete, so this introduction is still a preview." />}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Practice dashboard", "The day’s payroll work across authorised clients.", "/a"],
          ["Clients", "A file opens only after the employer authorises the practice.", "/a/clients"],
          ["Payroll calendar", "Pay dates and the EMP201 reminder sit on one calendar.", "/a/calendar"],
        ].map(([title, body, href]) => (
          <Link key={title} to={href} className="rounded-xl border border-line p-4 hover:border-blue-200">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-1 block text-sm leading-6 text-muted">{body}</span>
          </Link>
        ))}
      </div>
      <ButtonLink to="/a">Open the Harbour & Co workspace</ButtonLink>
    </JourneyFrame>
  );
}
