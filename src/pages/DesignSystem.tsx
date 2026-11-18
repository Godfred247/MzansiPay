import { useState } from "react";
import { Link } from "react-router-dom";
import type { PayLine } from "../domain.ts";
import { PayrollStatement } from "../finance.tsx";
import { Badge, Button, Card, CardTitle, ConfirmDialog, EmptyState, ErrorState, Field, Input, PageHeader, usePageTitle } from "../ui.tsx";

const sampleLines: PayLine[] = [
  { id: "basic", code: "BASIC", label: "Basic salary", kind: "earning", amount: 25000 },
  { id: "paye", code: "PAYE", label: "PAYE", kind: "employee_deduction", amount: 4200, note: "Sample amount. Not a statutory determination." },
  { id: "uif", code: "UIF", label: "UIF", kind: "employee_deduction", amount: 150, note: "Sample amount. Not a statutory determination." },
  { id: "uifer", code: "UIF-ER", label: "UIF", kind: "employer_contribution", amount: 150, note: "Sample amount. Not a statutory determination." },
  { id: "sdl", code: "SDL", label: "SDL", kind: "employer_contribution", amount: 250, note: "Sample amount. Not a statutory determination." },
];

export function DesignSystemPage() {
  usePageTitle("Design system");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <PageHeader
        eyebrow="MzansiPay"
        title="Design system"
        description="Navy navigation, blue actions, teal for net salary and employer cost. Shared by the employer, practice and mobile workspaces."
        actions={
          <Link to="/" className="text-sm font-medium text-blue-700">
            Back to sign in
          </Link>
        }
      />
      <Card>
        <CardTitle title="Colour" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Navy", "bg-navy", "#14213D"],
            ["Blue", "bg-blue-600", "#2563EB"],
            ["Teal", "bg-teal-600", "#0D9488"],
            ["Canvas", "bg-canvas", "#F8FAFC"],
          ].map(([name, swatch, hex]) => (
            <div key={name}>
              <div className={`h-14 rounded-lg border border-line ${swatch}`} />
              <p className="mt-2 text-sm font-medium">{name}</p>
              <p className="text-xs text-muted">{hex}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle title="Buttons, badges and fields" />
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="info">In review</Badge>
          <Badge tone="success">Paid</Badge>
          <Badge tone="warning">Waiting</Badge>
          <Badge tone="danger">Failed</Badge>
          <Badge tone="teal">Approved</Badge>
        </div>
        <div className="mt-4 max-w-sm">
          <Field label="Employee number" htmlFor="demo-input" error={value.length > 0 && value.length < 3 ? "Use at least 3 characters." : undefined}>
            <Input id="demo-input" value={value} invalid={value.length > 0 && value.length < 3} onChange={(event) => setValue(event.target.value)} placeholder="EMP-0142" />
          </Field>
        </div>
        <Button className="mt-4" variant="secondary" onClick={() => setOpen(true)}>
          Open confirmation
        </Button>
        <ConfirmDialog
          open={open}
          title="Approve this sample?"
          requireCheck
          checkLabel="I understand these figures are illustrative."
          confirmLabel="Approve"
          onClose={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
          body={<p>Net salary and employer cost stay in separate totals.</p>}
        />
      </Card>
      <PayrollStatement lines={sampleLines} taxable={25000} />
      <EmptyState title="Empty state" body="Used when a new organisation has no employees, payslips or payroll runs." />
      <ErrorState title="Something failed" body="Used when a payment file is rejected or a record cannot be opened. No money has moved." />
    </div>
  );
}
