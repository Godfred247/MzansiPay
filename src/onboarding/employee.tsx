import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../format.ts";
import { Button, ButtonLink, ConfirmDialog, Field, Input, usePageTitle } from "../ui.tsx";
import { useOnboarding } from "./context.tsx";
import { FormAlert, FormSuccess, JourneyFrame, Note } from "./frame.tsx";
import { EMPLOYEE_STEPS, INVITE, MFA_CODE, VERIFY_CODE } from "./model.ts";
import { isEmail, isSaPhone, passwordMessage } from "./validate.ts";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function useEmployeeStep(stepId: string) {
  const navigate = useNavigate();
  const api = useOnboarding();
  return {
    ...api,
    draft: api.state.employee,
    done: api.state.done.employee,
    complete(href: string) {
      api.markDone("employee", stepId);
      navigate(href);
    },
  };
}

function Shell({ stepId, title, description, backTo, onSubmit, submitLabel, children }: { stepId: string; title: string; description: string; backTo?: string; onSubmit?: (event: FormEvent) => void; submitLabel?: string; children: ReactNode }) {
  const { done } = useEmployeeStep(stepId);
  return (
    <JourneyFrame steps={EMPLOYEE_STEPS} current={stepId} done={done} title={title} description={description} backTo={backTo} onSubmit={onSubmit} submitLabel={submitLabel}>
      {children}
    </JourneyFrame>
  );
}

export function InvitationEmailPage() {
  usePageTitle("Invitation email");
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="font-semibold text-navy">
            MzansiPay
          </Link>
          <Link to="/login" className="text-sm font-medium text-blue-700">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted">Invitation email preview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">What the employee receives</h1>
        <p className="mt-2 text-sm leading-6 text-muted">This is a preview on the screen. No email is sent. The invitation is for a fictional employee at Khanyisa Retail.</p>
        <article className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
          <div className="bg-navy px-5 py-4 text-white">
            <p className="text-sm text-white/70">MzansiPay</p>
            <h2 className="mt-1 text-lg font-semibold">You are invited to view your pay</h2>
          </div>
          <div className="space-y-4 px-5 py-5 text-sm leading-6">
            <p>From: Khanyisa Retail payroll &lt;{INVITE.from}&gt;</p>
            <p>To: {INVITE.firstName} {INVITE.lastName} &lt;{INVITE.email}&gt;</p>
            <p>Subject: Your MzansiPay invitation from {INVITE.trading}</p>
            <p>{INVITE.firstName}, {INVITE.trading} has added you as {INVITE.title}. Create your account to see your own payslips, leave and documents. You will not see other employees.</p>
            <p>Your employee number on the invitation is {INVITE.employeeNumber}. Identity, tax and bank details stay hidden until you are inside your own profile, and even there the full numbers are not shown.</p>
            <ButtonLink to="/invite/accept">Review the invitation</ButtonLink>
            <p className="text-muted">If you were not expecting this, you can decline on the next screen. The sample invitation expires with this browser session.</p>
          </div>
        </article>
      </main>
    </div>
  );
}

export function AcceptInvitationPage() {
  const { draft, patchEmployee, complete } = useEmployeeStep("accept");
  const [decline, setDecline] = useState(false);

  function accept(event: FormEvent) {
    event.preventDefault();
    patchEmployee({ accepted: true, declined: false });
    complete("/invite/account");
  }

  return (
    <Shell stepId="accept" title="Accept the invitation" description={`${INVITE.trading} has invited ${INVITE.firstName} ${INVITE.lastName} to an employee account.`} onSubmit={accept} submitLabel="Accept and create an account">
      <dl className="divide-y divide-line rounded-xl border border-line">
        {[
          ["Employer", INVITE.company],
          ["Role", INVITE.title],
          ["Department", `${INVITE.department}, ${INVITE.branch}`],
          ["Pay cycle", INVITE.frequency],
          ["Start date", formatDate(INVITE.start)],
          ["Employee number", INVITE.employeeNumber],
        ].map(([term, detail]) => (
          <div key={term} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[180px_minmax(0,1fr)]">
            <dt className="text-muted">{term}</dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
      <Note>You will see only this employee record. Payslips appear after Khanyisa approves a payroll that includes you.</Note>
      {draft.declined ? <FormAlert message="The invitation is declined in this demonstration. Khanyisa is not actually notified. You can still accept it." /> : null}
      <Button type="button" variant="danger" onClick={() => setDecline(true)}>
        Decline invitation
      </Button>
      <ConfirmDialog
        open={decline}
        title="Decline this invitation?"
        body="You can accept it again from this page. No message is sent."
        confirmLabel="Decline"
        tone="danger"
        onClose={() => setDecline(false)}
        onConfirm={() => {
          patchEmployee({ declined: true, accepted: false });
          setDecline(false);
        }}
      />
    </Shell>
  );
}

export function EmployeeAccountPage() {
  const { draft, patchEmployee, complete } = useEmployeeStep("account");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!draft.firstName.trim()) next.firstName = "Enter your first name.";
    if (!draft.lastName.trim()) next.lastName = "Enter your last name.";
    if (!isEmail(draft.email)) next.email = "Enter the invitation email.";
    if (draft.email.trim().toLowerCase() !== INVITE.email) next.email = `Use the invitation address ${INVITE.email}.`;
    if (!isSaPhone(draft.mobile)) next.mobile = "Enter a South African mobile number, such as 082 000 0142.";
    setErrors(next);
    if (Object.keys(next).length) return;
    complete("/invite/verify");
  }

  return (
    <Shell stepId="account" title="Create your employee account" description="The email comes from the invitation. The password is a separate step, after the email is verified." backTo="/invite/accept" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="e-first" required error={errors.firstName}>
          <Input id="e-first" value={draft.firstName} invalid={Boolean(errors.firstName)} onChange={(event) => patchEmployee({ firstName: event.target.value })} />
        </Field>
        <Field label="Last name" htmlFor="e-last" required error={errors.lastName}>
          <Input id="e-last" value={draft.lastName} invalid={Boolean(errors.lastName)} onChange={(event) => patchEmployee({ lastName: event.target.value })} />
        </Field>
      </div>
      <Field label="Invitation email" htmlFor="e-email" required error={errors.email} hint="This address is fixed to the invitation.">
        <Input id="e-email" type="email" value={draft.email} invalid={Boolean(errors.email)} onChange={(event) => patchEmployee({ email: event.target.value })} />
      </Field>
      <Field label="Mobile number" htmlFor="e-mobile" required error={errors.mobile} hint="Used if you later choose SMS as a second factor.">
        <Input id="e-mobile" type="tel" value={draft.mobile} invalid={Boolean(errors.mobile)} onChange={(event) => patchEmployee({ mobile: event.target.value })} />
      </Field>
    </Shell>
  );
}

export function EmployeeVerifyPage() {
  const { complete, patchEmployee } = useEmployeeStep("verify");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (digits(code) !== VERIFY_CODE) {
      setError("That code does not match the sample. Use 482913.");
      return;
    }
    patchEmployee({ emailVerified: true });
    complete("/invite/password");
  }

  return (
    <Shell stepId="verify" title="Verify your email" description={`Confirm ${INVITE.email} before choosing a password.`} backTo="/invite/account" onSubmit={onSubmit} submitLabel="Verify email">
      <Note>
        No email is sent. The sample code is <span className="num font-medium text-ink">482 913</span>.
      </Note>
      <Field label="Verification code" htmlFor="e-code" required error={error}>
        <Input id="e-code" inputMode="numeric" maxLength={6} value={code} invalid={Boolean(error)} onChange={(event) => setCode(event.target.value)} />
      </Field>
      <FormSuccess message={resent} />
      <Button type="button" variant="secondary" onClick={() => setResent("The sample code is still 482913. No email was sent.")}>
        Resend sample code
      </Button>
    </Shell>
  );
}

export function EmployeePasswordPage() {
  const { complete, patchEmployee } = useEmployeeStep("password");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const password = passwordMessage(form.password);
    if (password) next.password = password;
    if (form.password !== form.confirm) next.confirm = "The passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    patchEmployee({ passwordSet: true });
    complete("/invite/mfa");
  }

  return (
    <Shell stepId="password" title="Choose a password" description="The password is checked on this page and then discarded. It is not stored." backTo="/invite/verify" onSubmit={onSubmit}>
      <Field label="Password" htmlFor="e-password" required error={errors.password} hint="At least 8 characters, with a letter and a number.">
        <Input id="e-password" type="password" autoComplete="new-password" value={form.password} invalid={Boolean(errors.password)} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      </Field>
      <Field label="Confirm password" htmlFor="e-confirm" required error={errors.confirm}>
        <Input id="e-confirm" type="password" autoComplete="new-password" value={form.confirm} invalid={Boolean(errors.confirm)} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
      </Field>
    </Shell>
  );
}

export function EmployeeMfaPage() {
  const { draft, patchEmployee, complete } = useEmployeeStep("mfa");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (digits(code) !== MFA_CODE) {
      setError("That code does not match the sample. Use 204816.");
      return;
    }
    patchEmployee({ mfaEnabled: true });
    complete("/invite/profile");
  }

  return (
    <Shell stepId="mfa" title="Set up multi-factor authentication" description="Employee payslips are personal records. Sign-in asks for a second code." backTo="/invite/password" onSubmit={onSubmit} submitLabel="Confirm code">
      <Note>
        Sample SMS to {draft.mobile || "your mobile"}: the code is 204816. No SMS is sent. You can also use the sample setup key SAMPLE-KEY-MZANSI-2048 in an authenticator app.
      </Note>
      <Field label="6-digit code" htmlFor="e-mfa" required error={error}>
        <Input id="e-mfa" inputMode="numeric" maxLength={6} value={code} invalid={Boolean(error)} onChange={(event) => setCode(event.target.value)} />
      </Field>
    </Shell>
  );
}

export function EmployeeProfilePage() {
  const { complete } = useEmployeeStep("profile");
  return (
    <Shell stepId="profile" title="Review the employee profile" description="Khanyisa supplied this record. Identity, tax and bank details stay masked. You cannot change employment details here." backTo="/invite/mfa" onSubmit={(event) => { event.preventDefault(); complete("/invite/confirm"); }} submitLabel="These details look right">
      <dl className="divide-y divide-line rounded-xl border border-line">
        {[
          ["Name", `${INVITE.firstName} ${INVITE.lastName}`],
          ["Employee number", INVITE.employeeNumber],
          ["Job title", INVITE.title],
          ["Department", INVITE.department],
          ["Branch", INVITE.branch],
          ["Pay cycle", INVITE.frequency],
          ["Start date", formatDate(INVITE.start)],
          ["Identity number", "Hidden"],
          ["Tax reference", "Hidden"],
          ["Bank account", "Hidden"],
          ["Annual leave", INVITE.annualLeave],
          ["Sick leave", INVITE.sickLeave],
          ["Family responsibility", INVITE.familyLeave],
        ].map(([term, detail]) => (
          <div key={term} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[200px_minmax(0,1fr)]">
            <dt className="text-muted">{term}</dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
      <Note>Leave balances are opening figures supplied for the invitation. They are not a statutory calculation.</Note>
    </Shell>
  );
}

export function EmployeeConfirmPage() {
  const { draft, patchEmployee, complete } = useEmployeeStep("confirm");
  const [checked, setChecked] = useState(draft.confirmed);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.preferredName.trim()) {
      setError("Enter the name you want on your profile.");
      return;
    }
    if (!checked) {
      setError("Confirm the personal details, or go back and tell the employer what to change.");
      return;
    }
    patchEmployee({ confirmed: true });
    complete("/invite/welcome");
  }

  return (
    <Shell stepId="confirm" title="Confirm your personal information" description="You can set the name you want to see. Employment, identity, tax and bank details stay with the employer." backTo="/invite/profile" onSubmit={onSubmit}>
      <Field label="Preferred name" htmlFor="preferred" required error={error && !draft.preferredName.trim() ? error : undefined} hint="This is the greeting on your home screen.">
        <Input id="preferred" value={draft.preferredName} onChange={(event) => patchEmployee({ preferredName: event.target.value })} />
      </Field>
      <Field label="Mobile number" htmlFor="confirm-mobile" hint="Captured on the account step.">
        <Input id="confirm-mobile" value={draft.mobile} readOnly />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
        <span>My name and mobile number are correct. If a job title or leave balance is wrong, I will ask {INVITE.trading} to change it.</span>
      </label>
      {error && draft.preferredName.trim() ? <p className="text-sm text-red-700">{error}</p> : null}
    </Shell>
  );
}

export function EmployeeWelcomePage() {
  const { draft, done } = useEmployeeStep("welcome");
  const name = draft.preferredName || INVITE.firstName;
  return (
    <JourneyFrame steps={EMPLOYEE_STEPS} current="welcome" done={done} title={`Welcome, ${name}`} description="This is your employee home. It shows only Boitumelo’s invitation. It does not show other people’s pay.">
      {draft.confirmed ? <FormSuccess message="Your account is ready in this demonstration. No payslip exists until Khanyisa runs payroll for you." /> : <FormAlert message="Personal details are not confirmed yet. You can still look at this introduction." />}
      <div className="mx-auto max-w-sm rounded-[28px] border border-line bg-slate-50 p-3">
        <div className="rounded-[22px] bg-white p-4">
          <p className="text-sm text-muted">{INVITE.trading}</p>
          <p className="mt-1 text-lg font-semibold">{name}</p>
          <p className="mt-4 text-sm text-muted">Latest net salary</p>
          <p className="mt-1 text-sm">No payslip yet</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Annual leave</dt><dd>{INVITE.annualLeave}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Sick leave</dt><dd>{INVITE.sickLeave}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Bank account</dt><dd>Hidden</dd></div>
          </dl>
        </div>
      </div>
      <p className="text-sm text-muted">The populated employee phone in the sample workspace belongs to Thandiwe Nkosi. Opening it does not reveal Boitumelo’s record, and Thandiwe cannot see Boitumelo.</p>
      <ButtonLink to="/me">Open Thandiwe’s sample phone</ButtonLink>
    </JourneyFrame>
  );
}

