/** Adaptive font sizes for KPI values based on displayed text length (currency-safe). */
export function getKpiValueSizeClass(value: string | number): string {
  const len = String(value).trim().length;

  if (len >= 14) return 'text-[9px] sm:text-base md:text-lg lg:text-2xl';
  if (len >= 11) return 'text-[10px] sm:text-lg md:text-xl lg:text-2xl';
  if (len >= 9) return 'text-xs sm:text-lg md:text-xl lg:text-2xl';
  if (len >= 7) return 'text-sm sm:text-xl lg:text-2xl';
  return 'text-base sm:text-xl lg:text-2xl';
}

/** Compact INR for tight mobile KPI slots; full value goes in title/tooltip. */
export function formatCurrencyCompact(amount: number | string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';

  if (Math.abs(n) >= 1_00_00_000) {
    return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  }
  if (Math.abs(n) >= 1_00_000) {
    return `₹${(n / 1_00_000).toFixed(2).replace(/\.?0+$/, '')}L`;
  }
  if (Math.abs(n) >= 1_000) {
    return `₹${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Use compact form on mobile when the full formatted string is long or amount ≥ 1 lakh. */
export function getKpiCurrencyDisplay(
  amount: number | string,
  fullFormatted: string,
): { mobile: string; desktop: string; full: string } {
  const full = fullFormatted;
  const n = Number(amount);

  if (full.length >= 12 || Math.abs(n) >= 1_00_000) {
    return {
      mobile: formatCurrencyCompact(amount),
      desktop: full,
      full,
    };
  }
  return { mobile: full, desktop: full, full };
}
