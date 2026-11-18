import type { Plan } from "../domain.ts";
import { formatRand } from "../format.ts";
import { Button, Field, Input } from "../ui.tsx";
import { CheckLine, Note } from "./frame.tsx";
import { DEMO_CARD, DEMO_CVC, DEMO_EXPIRY, vatSplit } from "./model.ts";

export interface CardDraft {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
  accepted: boolean;
}

export function emptyCard(): CardDraft {
  return { name: "", number: "", expiry: "", cvc: "", accepted: false };
}

export function cardErrors(card: CardDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!card.name.trim()) errors.name = "Enter the name on the card.";
  if (card.number.replace(/\s/g, "") !== DEMO_CARD) errors.number = "Use the demonstration card 0000 0000 0000 0000. A real card number is not accepted, and no payment is taken.";
  if (card.expiry.trim() !== DEMO_EXPIRY) errors.expiry = "Use the sample expiry 12/28.";
  if (card.cvc.trim() !== DEMO_CVC) errors.cvc = "Use the sample CVC 000.";
  if (!card.accepted) errors.accepted = "Confirm that this checkout takes no payment.";
  return errors;
}

export function CheckoutSummary({ plan, card, errors, onChange }: { plan: Plan; card: CardDraft; errors: Record<string, string>; onChange: (next: CardDraft) => void }) {
  const split = vatSplit(plan.price);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-xl border border-line p-4">
        <p className="text-sm font-semibold">{plan.name}</p>
        <p className="mt-1 text-sm text-muted">{plan.audience}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Monthly fee, excluding VAT</dt>
            <dd className="num">{formatRand(split.exVat)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">VAT at 15%</dt>
            <dd className="num">{formatRand(split.vat)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
            <dt>Total due today in this sample</dt>
            <dd className="num text-teal-700">{formatRand(split.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">The rows add to the plan price. No invoice is issued and no money moves.</p>
      </div>
      <div className="space-y-4">
        <Note>Demonstration card 0000 0000 0000 0000, expiry 12/28, CVC 000. Do not enter a real card.</Note>
        <Button type="button" variant="secondary" onClick={() => onChange({ ...card, name: card.name.trim() || "Kabelo Maseko", number: "0000 0000 0000 0000", expiry: DEMO_EXPIRY, cvc: DEMO_CVC })}>
          Use the demonstration card
        </Button>
        <Field label="Name on card" htmlFor="card-name" required error={errors.name}>
          <Input id="card-name" autoComplete="off" value={card.name} invalid={Boolean(errors.name)} onChange={(event) => onChange({ ...card, name: event.target.value })} />
        </Field>
        <Field label="Card number" htmlFor="card-number" required error={errors.number}>
          <Input id="card-number" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" value={card.number} invalid={Boolean(errors.number)} onChange={(event) => onChange({ ...card, number: event.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expiry" htmlFor="card-expiry" required error={errors.expiry} hint="MM/YY">
            <Input id="card-expiry" autoComplete="off" placeholder="MM/YY" value={card.expiry} invalid={Boolean(errors.expiry)} onChange={(event) => onChange({ ...card, expiry: event.target.value })} />
          </Field>
          <Field label="CVC" htmlFor="card-cvc" required error={errors.cvc}>
            <Input id="card-cvc" inputMode="numeric" autoComplete="off" value={card.cvc} invalid={Boolean(errors.cvc)} onChange={(event) => onChange({ ...card, cvc: event.target.value })} />
          </Field>
        </div>
        <CheckLine id="card-accept" checked={card.accepted} onChange={(accepted) => onChange({ ...card, accepted })} label="I understand this is a sample checkout. No payment is taken." />
        {errors.accepted ? <p className="text-sm text-red-700">{errors.accepted}</p> : null}
      </div>
    </div>
  );
}
