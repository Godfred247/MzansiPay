import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Input } from "../ui.tsx";
import { useOnboarding } from "./context.tsx";
import { AuthLayout, ChoiceCard, FormAlert, FormSuccess, Note } from "./frame.tsx";
import { MFA_CODE, VERIFY_CODE, type AccountKind } from "./model.ts";
import { isEmail, passwordMessage } from "./validate.ts";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function SignUpPage({ kind }: { kind: AccountKind | "" }) {
  const navigate = useNavigate();
  const { patchPerson } = useOnboarding();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "", terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const practice = kind === "accountant";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Enter your first name.";
    if (!form.lastName.trim()) next.lastName = "Enter your last name.";
    if (!isEmail(form.email)) next.email = "Enter a valid work email address.";
    const password = passwordMessage(form.password);
    if (password) next.password = password;
    if (form.password !== form.confirm) next.confirm = "The passwords do not match.";
    if (!form.terms) next.terms = "Confirm that this demonstration will not store the password.";
    setErrors(next);
    if (Object.keys(next).length) return;
    patchPerson({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      accountKind: kind,
      signupComplete: true,
    });
    navigate("/verify");
  }

  return (
    <AuthLayout
      title={practice ? "Create a practice account" : "Create your account"}
      lede={practice ? "This account belongs to a person at the practice. The practice profile comes next." : "Use your work email. You will choose an employer or a practice after verification."}
      aside={practice ? "A practice account prepares payroll. It does not approve the employer’s payment." : "Start with the person who will administer payroll."}
      footer={
        <p>
          Already registered?{" "}
          <Link className="font-medium text-blue-700" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="first-name" required error={errors.firstName}>
            <Input id="first-name" autoComplete="given-name" value={form.firstName} invalid={Boolean(errors.firstName)} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          </Field>
          <Field label="Last name" htmlFor="last-name" required error={errors.lastName}>
            <Input id="last-name" autoComplete="family-name" value={form.lastName} invalid={Boolean(errors.lastName)} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          </Field>
        </div>
        <Field label="Work email" htmlFor="signup-email" required error={errors.email}>
          <Input id="signup-email" type="email" autoComplete="email" value={form.email} invalid={Boolean(errors.email)} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field label="Password" htmlFor="signup-password" required error={errors.password} hint="At least 8 characters, with a letter and a number. It is checked here and then discarded.">
          <Input id="signup-password" type="password" autoComplete="new-password" value={form.password} invalid={Boolean(errors.password)} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <Field label="Confirm password" htmlFor="signup-confirm" required error={errors.confirm}>
          <Input id="signup-confirm" type="password" autoComplete="new-password" value={form.confirm} invalid={Boolean(errors.confirm)} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
        </Field>
        <label className="flex items-start gap-3 text-sm leading-6" htmlFor="terms">
          <input id="terms" type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" checked={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.checked })} />
          <span>This is a demonstration account. The password is not stored or sent.</span>
        </label>
        {errors.terms ? <p className="text-sm text-red-700">{errors.terms}</p> : null}
        <Button type="submit" className="w-full">
          Continue to email verification
        </Button>
      </form>
    </AuthLayout>
  );
}

export function VerifyPage() {
  const navigate = useNavigate();
  const { state, patchPerson } = useOnboarding();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState("");
  const [busy, setBusy] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setResent("");
    if (digits(code) !== VERIFY_CODE) {
      setError("That code does not match the sample. Use 482913.");
      return;
    }
    setError("");
    setBusy(true);
    window.setTimeout(() => {
      patchPerson({ emailVerified: true });
      navigate("/mfa");
    }, 600);
  }

  return (
    <AuthLayout
      title="Verify your email"
      lede={state.person.email ? `Enter the sample code for ${state.person.email}.` : "Enter the sample code to continue registration."}
      aside="Email verification confirms the address before payroll access is opened."
      footer={
        <Link className="font-medium text-blue-700" to="/signup">
          Use a different email
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Note>
          This demonstration does not send email. The sample code is <span className="num font-medium text-ink">482 913</span>.
        </Note>
        <Field label="Verification code" htmlFor="verify-code" required error={error}>
          <Input id="verify-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} invalid={Boolean(error)} onChange={(event) => setCode(event.target.value)} />
        </Field>
        <FormSuccess message={resent} />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Checking…" : "Verify email"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            setError("");
            setResent("A new sample code is ready. It is still 482913. No email was sent.");
          }}
        >
          Resend sample code
        </Button>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      setSent(false);
      return;
    }
    setError("");
    setSent(true);
  }

  return (
    <AuthLayout
      title="Forgot password"
      lede="Enter the work email on the account. This demonstration prepares a sample reset link on this page."
      aside="Password reset stays on the account email. It does not reveal whether a company is registered."
      footer={
        <Link className="font-medium text-blue-700" to="/login">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field label="Work email" htmlFor="forgot-email" required error={error}>
          <Input id="forgot-email" type="email" autoComplete="email" value={email} invalid={Boolean(error)} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        {sent ? (
          <FormSuccess message="If this demonstration had an inbox, a reset message would be prepared. No email was sent. Continue with the sample link." />
        ) : null}
        <Button type="submit" className="w-full">
          Prepare reset link
        </Button>
        {sent ? (
          <Link className="block text-center text-sm font-medium text-blue-700" to={`/reset?token=sample&email=${encodeURIComponent(email.trim())}`}>
            Open the sample reset page
          </Link>
        ) : null}
      </form>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token");
  const email = new URLSearchParams(window.location.search).get("email") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const validToken = token === "sample";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const password = passwordMessage(form.password);
    if (password) next.password = password;
    if (form.password !== form.confirm) next.confirm = "The passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setDone(true);
  }

  return (
    <AuthLayout
      title="Reset password"
      lede={email ? `Choose a new password for ${email}.` : "Choose a new password for this sample reset."}
      aside="The new password is checked on this page and then discarded."
      footer={
        <Link className="font-medium text-blue-700" to="/forgot">
          Request another sample link
        </Link>
      }
    >
      {validToken ? (
        done ? (
          <div className="space-y-4">
            <FormSuccess message="The password passed validation. It was not stored or sent." />
            <Link to="/login" className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-3.5 text-sm font-medium text-white">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <Field label="New password" htmlFor="reset-password" required error={errors.password} hint="At least 8 characters, with a letter and a number.">
              <Input id="reset-password" type="password" autoComplete="new-password" value={form.password} invalid={Boolean(errors.password)} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </Field>
            <Field label="Confirm new password" htmlFor="reset-confirm" required error={errors.confirm}>
              <Input id="reset-confirm" type="password" autoComplete="new-password" value={form.confirm} invalid={Boolean(errors.confirm)} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
            </Field>
            <Button type="submit" className="w-full">
              Reset password
            </Button>
          </form>
        )
      ) : (
        <div className="space-y-4">
          <FormAlert message="This reset link cannot be used. It has no sample token." />
          <Link className="font-medium text-blue-700" to="/forgot">
            Prepare a new sample link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

export function MfaPage() {
  const navigate = useNavigate();
  const { state, patchPerson } = useOnboarding();
  const [method, setMethod] = useState<"" | "app" | "sms">(state.person.mfaMethod);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(state.person.mfaEnabled);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!method) {
      setError("Choose an authenticator app or SMS.");
      return;
    }
    if (digits(code) !== MFA_CODE) {
      setError("That code does not match the sample. Use 204816.");
      return;
    }
    patchPerson({ mfaMethod: method, mfaEnabled: true });
    setError("");
    setReady(true);
  }

  function finish() {
    navigate(state.person.accountKind === "accountant" ? "/start/accountant/practice" : "/start/account-type");
  }

  return (
    <AuthLayout
      title="Set up multi-factor authentication"
      lede="Payroll sign-in asks for a second check after the password. This page uses a sample code only."
      aside="Two-factor authentication protects payslips, identity numbers and bank details."
    >
      {ready ? (
        <div className="space-y-4">
          <FormSuccess message="Multi-factor authentication is marked on for this demonstration." />
          <Note>
            Sample backup codes: MZ-2048-A, MZ-2048-B, MZ-2048-C, MZ-2048-D. They cannot be used to sign in.
          </Note>
          <Button type="button" className="w-full" onClick={finish}>
            Continue
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <ChoiceCard name="mfa" checked={method === "app"} title="Authenticator app" body="Use the sample setup key. A live QR code is not generated." onChange={() => setMethod("app")} />
          <ChoiceCard name="mfa" checked={method === "sms"} title="SMS" body="Use the sample SMS code. No message is sent to a phone." onChange={() => setMethod("sms")} />
          {method === "app" ? (
            <Note>
              Sample setup key: <span className="font-medium text-ink">SAMPLE-KEY-MZANSI-2048</span>
            </Note>
          ) : null}
          {method === "sms" ? <Note>The sample SMS code is 204816. No SMS is sent.</Note> : null}
          <Field label="6-digit code" htmlFor="mfa-code" required error={error} hint="The sample code is 204816.">
            <Input id="mfa-code" inputMode="numeric" maxLength={6} value={code} invalid={Boolean(error)} onChange={(event) => setCode(event.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Confirm code
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function AccountTypePage() {
  const navigate = useNavigate();
  const { state, patchPerson } = useOnboarding();
  const [kind, setKind] = useState<AccountKind | "">(state.person.accountKind);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!kind) {
      setError("Choose an employer organisation or an accounting practice.");
      return;
    }
    patchPerson({ accountKind: kind });
    navigate(kind === "employer" ? "/start/employer/organisation" : "/start/accountant/practice");
  }

  return (
    <AuthLayout
      title="Choose the account type"
      lede="An employer account runs one organisation. A practice account prepares payroll for employers who have granted access."
      aside="The two account types share a design system and keep separate navigation."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <ChoiceCard name="kind" checked={kind === "employer"} title="Employer organisation" body="Company payroll, employees, payslips, leave and the subscription for that organisation." onChange={() => setKind("employer")} />
        <ChoiceCard name="kind" checked={kind === "accountant"} title="Accounting practice" body="A practice profile, a team and a practice subscription. Client files come later, by invitation." onChange={() => setKind("accountant")} />
        <FormAlert message={error} />
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
}
