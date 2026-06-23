import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getKpiValueSizeClass } from '@/utils/kpiDisplay';

interface KpiMetricCardProps {
  label: string;
  value: string | number;
  /** Shorter value shown below sm breakpoint when the main value is long (e.g. ₹1L) */
  mobileValue?: string;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
  highlight?: boolean;
}

export function KpiMetricCard({
  label,
  value,
  mobileValue,
  sub,
  icon: Icon,
  iconClassName = 'bg-primary/10 text-primary ring-primary/20',
  valueClassName,
  highlight,
}: KpiMetricCardProps) {
  const display = String(value);
  const sizeClass = getKpiValueSizeClass(mobileValue ?? display);
  const showDual = !!mobileValue && mobileValue !== display;

  return (
    <Card
      className={cn(
        'border shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full',
        highlight && 'border-orange-300 bg-orange-50/40',
      )}
    >
      <CardContent className="p-2.5 sm:p-4 flex flex-col h-full min-h-[76px] sm:min-h-[88px]">
        {/* Label + icon row — keeps value row full width */}
        <div className="flex items-center justify-between gap-1.5 mb-1 sm:mb-1.5">
          <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight line-clamp-2 min-w-0 flex-1">
            {label}
          </p>
          <div className={cn('p-1.5 sm:p-2 rounded-md sm:rounded-lg ring-1 shrink-0', iconClassName)}>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        </div>

        {/* Value — full width, scales with length */}
        <div className="flex-1 flex flex-col justify-center min-w-0" title={showDual ? display : undefined}>
          {showDual ? (
            <>
              <p
                className={cn(
                  'font-bold tabular-nums leading-tight whitespace-normal break-words sm:hidden',
                  getKpiValueSizeClass(mobileValue!),
                  valueClassName,
                )}
              >
                {mobileValue}
              </p>
              <p
                className={cn(
                  'font-bold tabular-nums leading-tight whitespace-normal break-words hidden sm:block',
                  sizeClass,
                  valueClassName,
                )}
              >
                {display}
              </p>
            </>
          ) : (
            <p
              className={cn(
                'font-bold tabular-nums leading-tight whitespace-normal break-words',
                sizeClass,
                valueClassName,
              )}
            >
              {display}
            </p>
          )}
        </div>

        {sub && (
          <p className="text-[9px] sm:text-xs text-muted-foreground mt-1 leading-tight line-clamp-2">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
