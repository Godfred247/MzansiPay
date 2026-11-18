import { useState, type FormEvent } from "react";
import type { LineKind, PayCode } from "../domain.ts";
import { CODES, fullName, kindLabel } from "../domain.ts";
import { formatRand, uid } from "../format.ts";
import { useApp, useOrg } from "../state.tsx";
import { useWorkspace } from "../workspace.ts";
import { Badge, Button, Card, CardTitle, ConfirmDialog, EmptyState, Field, Input, PageHeader, Tabs, Textarea } from "../ui.tsx";

export function EarningsPage() {
  const { codes, orgId, org } = useOrg();
  const { dispatch } = useApp();
  const { actor } = useWorkspace();
  const [tab, setTab] = useState("active");
  const [open, setOpen] = useState(false);
  const [retire, setRetire] = useState<PayCode | null>(null);
  const [form, setForm] = useState({ code: "", label: "", kind: "earning" as LineKind, description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const visible = codes.filter((code) => (tab === "active" ? code.active : !code.active));

  function save(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[A-Z0-9-]{2,12}$/.test(form.code)) next.code = "Use 2–12 letters or numbers, for example UNION2.";
    if (codes.some((code) => code.code === form.code)) next.code = "That code already exists.";
    if (form.label.trim().length < 2) next.label = "Enter a name.";
    setErrors(next);
    if (Object.keys(next).length) return;
    dispatch({
      type: "add-code",
      actor,
      code: { id: uid("code"), orgId, code: form.code, label: form.label.trim(), kind: form.kind, active: true, description: form.description.trim() || "Added in this demonstration." },
    });
    setOpen(false);
    setForm({ code: "", label: "", kind: "earning", description: "" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={org.tradingName}
        title="Earnings and deductions"
        description="Employee deductions and employer contributions are different code types. An employer cost cannot be saved as a deduction."
        actions={<Button onClick={() => setOpen(true)}>Add code</Button>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ]}
      />
      {visible.length === 0 ? (
        <EmptyState title={tab === "archived" ? "Nothing is archived" : "No pay codes"} body={tab === "archived" ? "Archive a code when it should no longer be used on new lines." : "Add a code to describe an earning, an employee deduction, or an employer contribution."} />
      ) : (
        <div className="grid gap-3">
          {visible.map((code) => (
            <Card key={code.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{code.label}</h2>
                    <Badge tone={code.kind === "employer_contribution" ? "teal" : code.kind === "employee_deduction" ? "info" : "neutral"}>{kindLabel(code.kind)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {code.code} · {code.description}
                  </p>
                </div>
                {code.active ? (
                  <Button size="sm" variant="secondary" onClick={() => setRetire(code)}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
      {open ? (
        <Card>
          <form className="space-y-4" onSubmit={save} noValidate>
            <CardTitle title="New pay code" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" htmlFor="code" error={errors.code}>
                <Input id="code" invalid={Boolean(errors.code)} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
              </Field>
              <Field label="Name" htmlFor="code-name" error={errors.label}>
                <Input id="code-name" invalid={Boolean(errors.label)} value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} />
              </Field>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Type</legend>
              <div className="mt-2 space-y-2 text-sm">
                {(
                  [
                    ["earning", "Earning", "Adds to gross earnings."],
                    ["employee_deduction", "Employee deduction", "Withheld from the employee and reduces net salary."],
                    ["employer_contribution", "Employer contribution", "Paid by the employer. Does not reduce net salary."],
                  ] as const
                ).map(([kind, label, hint]) => (
                  <label key={kind} className="flex items-start gap-2">
                    <input type="radio" name="kind" checked={form.kind === kind} onChange={() => setForm({ ...form, kind })} />
                    <span>
                      <span className="font-medium">{label}</span>
                      <span className="block text-muted">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Description" htmlFor="code-description">
              <Textarea id="code-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Save code</Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
      <ConfirmDialog
        open={retire !== null}
        title="Archive this code?"
        body={`Existing lines that use ${retire?.label ?? "this code"} stay on current payslips. New inputs should use another code.`}
        confirmLabel="Archive code"
        tone="danger"
        onClose={() => setRetire(null)}
        onConfirm={() => {
          if (retire) dispatch({ type: "deactivate-code", id: retire.id, actor });
          setRetire(null);
          setTab("archived");
        }}
      />
    </div>
  );
}

export function BenefitsPage() {
  const { employees, org } = useOrg();
  const medical = employees.filter((employee) => employee.lines.some((line) => line.code === CODES.medical || line.code === CODES.medicalEr));
  const pension = employees.filter((employee) => employee.lines.some((line) => line.code === CODES.pension || line.code === CODES.pensionEr));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={org.tradingName} title="Benefits" description="Benefit contributions on the November sample are split between the employee and the employer. They are not a recommendation of a real scheme." />
      {employees.length === 0 ? (
        <EmptyState title="No benefit memberships" body="Medical aid and retirement memberships appear when employees have those lines." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle title="Umbrella Health" description="Fictional medical aid used for this sample. Employee and employer portions are separate pay codes." />
            <MemberList people={medical} empty="No employees have a medical aid line this period." />
          </Card>
          <Card>
            <CardTitle title="Southern Retirement Fund" description="Fictional retirement fund. The sample rule on file is 5% of basic for members. Payslip amounts are the stored lines, not a fresh calculation." />
            <MemberList people={pension} empty="No employees have a pension line this period." />
          </Card>
          <Card className="lg:col-span-2">
            <CardTitle title="Group life" description="Cover is noted on the employee file. Premiums are not part of the November payroll sample, so they are not shown as a rand amount." />
            <p className="text-sm text-muted">No group life premium is included in employer payroll cost for this period.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

function MemberList({ people, empty }: { people: { id: string; firstName: string; lastName: string; lines: { code: string; kind: string; amount: number }[] }[]; empty: string }) {
  if (people.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line text-sm">
      {people.map((person) => {
        const employeeAmount = person.lines.filter((line) => line.kind === "employee_deduction" && (line.code === CODES.medical || line.code === CODES.pension)).reduce((sum, line) => sum + line.amount, 0);
        const employerAmount = person.lines.filter((line) => line.kind === "employer_contribution" && (line.code === CODES.medicalEr || line.code === CODES.pensionEr)).reduce((sum, line) => sum + line.amount, 0);
        return (
          <li key={person.id} className="flex justify-between gap-3 py-2">
            <span>{fullName(person)}</span>
            <span className="text-right text-muted">
              Employee <span className="num text-ink">{formatRand(employeeAmount)}</span>
              <span className="mx-1">·</span>
              Employer <span className="num text-ink">{formatRand(employerAmount)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
