import { Link } from 'react-router-dom';
import {
  Banknote, Package, TrendingUp, ArrowLeft, ChevronRight,
  LayoutGrid, ShoppingCart, DollarSign, BarChart2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const reportSections = [
  {
    to: '/reports/cash-credit',
    icon: Banknote,
    title: 'Cash & Credit Sales',
    description: 'Cash sales, credit sales, and combined totals with date filters',
    color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
    tags: ['Cash Sales', 'Credit Sales'],
  },
  {
    to: '/reports/purchase-quantity',
    icon: Package,
    title: 'Purchase Quantity',
    description: 'Item-wise purchase quantities with brand, category, and store filters',
    color: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
    tags: ['Purchase Qty', 'Purchase Price'],
  },
  {
    to: '/reports/profit',
    icon: TrendingUp,
    title: 'Profit & Loss',
    description: 'Sales price, cost, profit margin, and P&L analysis',
    color: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20',
    tags: ['Sales Qty', 'Sales Price', 'P&L'],
  },
  {
    to: '/reports/product',
    icon: LayoutGrid,
    title: 'Product Report',
    description: 'Stock history, sales, pricing, profit, and adjustment tracking',
    color: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
    tags: ['Stock History', 'Sales', 'Profit'],
  },
];

const analyticsHighlights = [
  { icon: ShoppingCart, label: 'Sales Quantity', desc: 'Units sold by product' },
  { icon: DollarSign, label: 'Sales Price', desc: 'Revenue breakdown' },
  { icon: BarChart2, label: 'Advanced Filters', desc: 'Date, store, brand, category' },
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
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Cash/credit sales, quantities, pricing, and profit analysis
          </p>
        </div>
      </div>

      {/* Quick highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {analyticsHighlights.map(({ icon: Icon, label, desc }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reportSections.map(({ to, icon: Icon, title, description, color, tags }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full border shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99] overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ring-1 shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold">{title}</h2>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
          <LayoutGrid className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            All reports support responsive filters, sortable tables, charts, and pagination for fast analysis on desktop and mobile.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
