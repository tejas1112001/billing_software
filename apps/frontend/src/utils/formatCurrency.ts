export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

/**
 * PDF-safe currency formatter.
 * Uses "Rs" instead of the rupee symbol (₹) because jsPDF's built-in
 * Helvetica/Times fonts do not include the ₹ glyph and render it as "1".
 */
export function formatCurrencyForPdf(amount: number | string): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
  return `Rs ${formatted}`;
}
