import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SkeletonTable } from './SkeletonTable';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  getRowKey?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, isLoading, getRowKey }: DataTableProps<T>) {
  if (isLoading) return <SkeletonTable rows={5} cols={columns.length} />;
  if (!data.length) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={`text-xs sm:text-sm ${col.className || ''}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={getRowKey ? getRowKey(row) : i}>
              {columns.map((col) => (
                <TableCell key={col.key} className={`text-xs sm:text-sm py-2.5 sm:py-3 ${col.className || ''}`}>
                  {col.cell ? col.cell(row) : String(row[col.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
