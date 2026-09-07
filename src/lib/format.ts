export function formatCurrency(amount: unknown, currency: string | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount as number);
  if (typeof num !== "number" || !isFinite(num)) return "—";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: currency || "ZAR",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${currency ?? ""} ${num.toLocaleString("en-ZA")}`.trim();
  }
}

export function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

export function daysUntil(value: Date | string | null): number | null {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
