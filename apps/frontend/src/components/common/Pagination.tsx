import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ page, pageSize, total, totalPages, onPageChange, onPageSizeChange }: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row items-center justify-between px-3 py-3 sm:px-4">
      {/* Results text - Hidden on very small screens, shown on sm+ */}
      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} results
      </p>
      
      {/* Mobile: Compact layout */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            <span className="hidden sm:inline">Rows per page</span>
            <span className="sm:hidden">Per page</span>
          </span>
          <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
            <SelectTrigger className="h-7 w-14 text-xs sm:h-8 sm:w-16 sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {/* Page navigation */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 sm:h-8 sm:w-8" 
            onClick={() => onPageChange(page - 1)} 
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <span className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
            {page} / {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 sm:h-8 sm:w-8" 
            onClick={() => onPageChange(page + 1)} 
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
