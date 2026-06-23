import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ReportResponsiveFiltersProps {
  activeCount?: number;
  onReset?: () => void;
  children: React.ReactNode;
}

export function ReportResponsiveFilters({
  activeCount = 0,
  onReset,
  children,
}: ReportResponsiveFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const filterContent = (
    <div className="space-y-4">
      {children}
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset} className="w-full sm:w-auto gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: compact filter bar + bottom sheet */}
      <div className="md:hidden flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 gap-2 justify-center"
          onClick={() => setSheetOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
        {onReset && activeCount > 0 && (
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="pb-6">{filterContent}</div>
          <Button className="w-full" onClick={() => setSheetOpen(false)}>
            Apply Filters
          </Button>
        </SheetContent>
      </Sheet>

      {/* Desktop: inline card */}
      <Card className="hidden md:block border shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {activeCount} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">{filterContent}</CardContent>
      </Card>
    </>
  );
}

export function countReportFilters(...values: (string | undefined)[]): number {
  return values.filter((v) => v && v !== 'all').length;
}
