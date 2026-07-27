// Small display-formatting helpers that were copy-pasted with identical
// bodies across several dashboard pages (wallet, checkout, header, sidebar).
// Single source of truth so a future currency/locale tweak only happens once.

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(num);
}

/** "2026-06-12 14:30:00" (MySQL datetime) -> "12 Haziran 2026" */
export function formatDate(value) {
  if (!value) return "";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
