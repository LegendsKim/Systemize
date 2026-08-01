export function formatPortalDateTime(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}
export function formatIls(amountAgorot: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: amountAgorot % 100 === 0 ? 0 : 2,
  }).format(amountAgorot / 100);
}
