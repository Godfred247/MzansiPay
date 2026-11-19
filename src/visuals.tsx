import { Link } from "react-router-dom";
import { formatRand } from "./format.ts";
import { cn } from "./ui.tsx";

export function SectionLinks({ items }: { items: { to: string; label: string }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <Link key={item.to} to={item.to} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-blue-200">
          {item.label}
        </Link>
      ))}
    </div>
  );
}

const barTones = {
  navy: "bg-navy",
  blue: "bg-blue-600",
  teal: "bg-teal-600",
  slate: "bg-slate-300",
  amber: "bg-amber-500",
};

export function SplitBar({
  title,
  note,
  parts,
}: {
  title: string;
  note?: string;
  parts: { label: string; value: number; tone: keyof typeof barTones }[];
}) {
  const total = parts.reduce((sum, part) => sum + Math.max(part.value, 0), 0) || 1;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        {parts.map((part) => (
          <div key={part.label} className={barTones[part.tone]} style={{ width: `${(Math.max(part.value, 0) / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span className={cn("h-2.5 w-2.5 rounded-sm", barTones[part.tone])} />
              {part.label}
            </span>
            <span className="num font-medium text-ink">{formatRand(part.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MeterList({ rows }: { rows: { label: string; value: number; max: number; detail: string }[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{row.label}</span>
            <span className="num text-muted">{row.detail}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, (row.value / (row.max || 1)) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function FlowDiagram() {
  const employee = ["Gross earnings", "Employee deductions", "Net salary"];
  const employer = ["Employer contributions", "Employer payroll cost"];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {employee.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            <span className={cn("rounded-lg border px-3 py-2 text-sm font-medium", index === 2 ? "border-teal-200 bg-teal-50 text-teal-800" : "border-line bg-white")}>{label}</span>
            {index < employee.length - 1 ? <span className="text-muted" aria-hidden="true">→</span> : null}
          </li>
        ))}
      </ol>
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {employer.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            <span className={cn("rounded-lg border px-3 py-2 text-sm font-medium", index === 1 ? "border-teal-200 bg-teal-50 text-teal-800" : "border-line bg-slate-50")}>{label}</span>
            {index === 0 ? <span className="text-muted" aria-hidden="true">+</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MonthGrid({
  year,
  month,
  marks,
}: {
  year: number;
  month: number;
  marks: { day: number; label: string; tone: "blue" | "teal" | "amber" }[];
}) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [...Array.from({ length: first }, () => 0), ...Array.from({ length: days }, (_, index) => index + 1)];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          const mark = marks.find((item) => item.day === day);
          return (
            <div key={`${index}-${day}`} className={cn("min-h-14 rounded-lg border p-1.5 text-left text-xs", day === 0 ? "border-transparent" : "border-line bg-white", mark?.tone === "amber" && "border-amber-200 bg-amber-50", mark?.tone === "teal" && "border-teal-200 bg-teal-50", mark?.tone === "blue" && "border-blue-200 bg-blue-50")}>
              {day > 0 ? <span className="font-medium">{day}</span> : null}
              {mark ? <p className="mt-1 leading-4 text-ink">{mark.label}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Pipeline({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {steps.map((step, index) => (
        <li key={step} className={cn("rounded-lg border px-3 py-2 text-sm", index < current ? "border-teal-200 bg-teal-50" : index === current ? "border-blue-600 bg-blue-50" : "border-line bg-white")}>
          <span className="block text-xs text-muted">{index + 1}</span>
          <span className="font-medium">{step}</span>
        </li>
      ))}
    </ol>
  );
}
