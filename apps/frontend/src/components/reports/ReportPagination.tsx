import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportPaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function ReportPagination({ page, pages, total, onPageChange }: ReportPaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
        Page {page} of {pages} · {total} items
      </p>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 sm:flex-initial h-9"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 sm:flex-initial h-9"
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page === pages}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}
