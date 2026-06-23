import { LucideIcon } from 'lucide-react';
import { KpiMetricCard } from '@/components/common/KpiMetricCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { getKpiCurrencyDisplay } from '@/utils/kpiDisplay';

interface ReportKpiCardProps {
  label: string;
  value: string | number;
  /** Raw numeric amount — enables compact mobile display for long currency strings */
  amount?: number | string;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
}

export function ReportKpiCard({
  label,
  value,
  amount,
  sub,
  icon,
  iconClassName,
  valueClassName,
}: ReportKpiCardProps) {
  const display = String(value);
  const isCurrency = display.includes('₹') || amount !== undefined;
  let mobileValue: string | undefined;

  if (isCurrency && amount !== undefined) {
    const full = typeof value === 'string' ? value : formatCurrency(amount);
    const { mobile, desktop, full: fullText } = getKpiCurrencyDisplay(amount, full);
    if (mobile !== desktop) {
      return (
        <KpiMetricCard
          label={label}
          value={desktop}
          mobileValue={mobile}
          sub={sub}
          icon={icon}
          iconClassName={iconClassName}
          valueClassName={valueClassName}
        />
      );
    }
    return (
      <KpiMetricCard
        label={label}
        value={fullText}
        sub={sub}
        icon={icon}
        iconClassName={iconClassName}
        valueClassName={valueClassName}
      />
    );
  }

  return (
    <KpiMetricCard
      label={label}
      value={value}
      sub={sub}
      icon={icon}
      iconClassName={iconClassName}
      valueClassName={valueClassName}
    />
  );
}

/** Helper for report KPIs backed by a numeric amount */
export function currencyKpi(amount: number | string) {
  const full = formatCurrency(amount);
  const { mobile, desktop } = getKpiCurrencyDisplay(amount, full);
  return { full, mobile, desktop, amount };
}
