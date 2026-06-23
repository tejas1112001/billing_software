import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { userLogService } from '@/services/userLogService';
import { usePagination } from '@/hooks/usePagination';
import { formatDateTime } from '@/utils/formatDate';
import type { UserLog, LogAction } from '@/types';

const LOG_ACTIONS: LogAction[] = [
  'LOGIN',
  'LOGOUT',
  'BILL_CREATION',
  'RECEIPT_CREATION',
  'PRODUCT_CREATION',
  'PRODUCT_UPDATE',
  'BRAND_CREATION',
  'CATEGORY_CREATION',
  'STORE_CREATION',
  'USER_CREATION',
  'PAYMENT_METHOD_CREATION',
  'PAYMENT_METHOD_UPDATE',
];

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  LOGIN: 'success',
  LOGOUT: 'secondary',
  BILL_CREATION: 'default',
  RECEIPT_CREATION: 'secondary',
  PRODUCT_CREATION: 'outline',
  PRODUCT_UPDATE: 'warning',
  BRAND_CREATION: 'outline',
  CATEGORY_CREATION: 'outline',
  STORE_CREATION: 'outline',
  USER_CREATION: 'default',
  PAYMENT_METHOD_CREATION: 'outline',
  PAYMENT_METHOD_UPDATE: 'warning',
};

export default function UserLogsPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['user-logs', page, pageSize, action, dateFrom, dateTo],
    queryFn: () =>
      userLogService.list({
        page,
        pageSize,
        ...(action && action !== '_all' ? { action } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      }),
  });

  const columns: ColumnDef<UserLog>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (r) => <span className="font-medium">{r.user?.username || '-'}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      cell: (r) => (
        <Badge variant={ACTION_COLORS[r.action] || 'secondary'} className="text-xs">
          {r.action.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'meta',
      header: 'Details',
      cell: (r) => {
        if (!r.meta || typeof r.meta !== 'object') return null;
        const m = r.meta as Record<string, unknown>;
        const detail = m.billNumber || m.receiptNumber || m.name || m.username || '';
        return detail ? <span className="text-xs text-muted-foreground font-mono">{String(detail)}</span> : null;
      },
    },
    {
      key: 'createdAt',
      header: 'Date & Time',
      cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Back Navigation */}
      <Link to="/admin">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Admin Panel</span>
        </Button>
      </Link>
      
      <PageHeader
        title="User Logs"
        description="Audit trail of all significant system events"
      />

      {/* Mobile Filters - Sheet/Drawer */}
      <div className="mb-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Logs</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5 block font-medium">Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Actions</SelectItem>
                    {LOG_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block font-medium">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block font-medium">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters - Inline */}
      <Card className="mb-3 hidden lg:block">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <Label className="text-xs mb-1.5 block font-medium">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Actions</SelectItem>
                  {LOG_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block font-medium">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block font-medium">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View - Only on mobile */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          // Empty state
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No logs found</p>
          </div>
        ) : (
          // Log cards
          data.data.map((log: any) => {
            const meta = log.meta as Record<string, unknown> | null;
            const detail = meta ? (meta.billNumber || meta.receiptNumber || meta.name || meta.username || '') : '';
            
            return (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {log.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                    <Badge 
                      variant={ACTION_COLORS[log.action] || 'secondary'} 
                      className="text-xs shrink-0"
                    >
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {detail && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Details: </span>
                        <span className="font-mono">{String(detail)}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
        
        {/* Mobile Pagination */}
        {data && data.data.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table View - Only on desktop */}
      <div className="hidden lg:block rounded-lg border bg-card shadow-sm">
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={(data?.data || []) as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as UserLog).id}
        />
        {data && (
          <div className="border-t">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}

