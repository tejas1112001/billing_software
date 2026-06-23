import { Link } from 'react-router-dom';
import { Banknote, Package, TrendingUp, ArrowLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const reportSections = [
  {
    to: '/reports/cash-credit',
    icon: Banknote,
    title: 'Cash and Credit',
    description: 'Cash, credit & total sales with date filters',
    color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  },
  {
    to: '/reports/purchase-quantity',
    icon: Package,
    title: 'Purchases Qty',
    description: 'Item-wise quantities and overall totals',
    color: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  },
  {
    to: '/reports/profit',
    icon: TrendingUp,
    title: 'Profit Report',
    description: 'Sales, cost, profit & margin analysis',
    color: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20',
  },
];

export default function ReportsIndex() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      <div className="flex items-start gap-2.5">
        <Button variant="outline" size="icon" asChild className="shrink-0 h-9 w-9 sm:h-8 sm:w-auto sm:px-3">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Dashboard</span>
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">All Reports</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Tap a report to view KPIs, charts, and filtered data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reportSections.map(({ to, icon: Icon, title, description, color }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full border shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99] overflow-hidden">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ring-1 shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold truncate">{title}</h2>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-4 flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span>All reports support mobile filters, pagination, and responsive tables.</span>
        </CardContent>
      </Card>
    </div>
  );
}
