export const DEMO_DATE_LABEL = "18 Nov 2026";
export const DEMO_DATE_LONG = "Wednesday, 18 Nov 2026";
export const DEMO_TIME = "21:23 SAST";

export const ILLUSTRATIVE =
  "Illustrative payroll data. Amounts are sample figures for interface review. They are not a legally verified PAYE, UIF, SDL or other statutory calculation. MzansiPay is not a SARS service and is not endorsed by SARS.";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatRand(value: number): string {
  const negative = value < 0;
  const [whole, fraction] = Math.abs(value).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}R${grouped}.${fraction}`;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(iso));
  return `${formatted} SAST`;
}

export function inclusiveDays(start: string, end: string): number {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000) + 1;
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function avatarClass(seed: string): string {
  const tones = ["bg-navy", "bg-blue-800", "bg-teal-800", "bg-[#243456]", "bg-[#1E3A5F]"];
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % tones.length;
  return tones[hash] ?? tones[0];
}

export function maskAccount(input: string): string {
  const digits = input.replace(/\D/g, "");
  const last4 = (digits.slice(-4) || "0000").padStart(4, "0");
  return `••••${last4}`;
}

export function downloadText(filename: string, content: string, mime = "text/plain"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
