import { Link } from 'react-router-dom';
import {
  Banknote, Package, TrendingUp, LayoutGrid,
  ArrowLeft, ChevronRight, BarChart2,
  ShoppingCart, DollarSign, SlidersHorizontal,
  Activity, Sparkles,
} from 'lucide-react';

const reportCards = [
  {
    to: '/reports/cash-credit',
    icon: Banknote,
    title: 'Gold & Platinum Sales',
    description:
      'Compare Gold and Platinum operator sales side-by-side with date range filters and totals.',
    gradient: 'from-blue-600 to-indigo-700',
    iconBg: 'bg-blue-500/15 text-blue-500',
    tags: ['Gold Sales', 'Platinum Sales', 'Combined'],
    stat: { label: 'Sales channels', value: '2' },
  },
  {
    to: '/reports/purchase-quantity',
    icon: Package,
    title: 'Purchase Quantity',
    description:
      'Item-wise purchase quantities with brand, category, and store filters for inventory insight.',
    gradient: 'from-emerald-500 to-teal-700',
    iconBg: 'bg-emerald-500/15 text-emerald-500',
    tags: ['Purchase Qty', 'Purchase Price'],
    stat: { label: 'Filter types', value: '3' },
  },
  {
    to: '/reports/profit',
    icon: TrendingUp,
    title: 'Profit & Loss',
    description:
      'Full P&L breakdown — sales price, cost, profit margin, and analysis by product and period.',
    gradient: 'from-violet-600 to-purple-800',
    iconBg: 'bg-violet-500/15 text-violet-500',
    tags: ['Sales Qty', 'Sales Price', 'P&L'],
    stat: { label: 'Metrics tracked', value: '4' },
  },
  {
    to: '/reports/product',
    icon: LayoutGrid,
    title: 'Product Report',
    description:
      'Stock history, sales, pricing, profit, and adjustment tracking per product.',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-500/15 text-amber-500',
    tags: ['Stock History', 'Sales', 'Profit', 'Adjustments'],
    stat: { label: 'Report views', value: '4' },
  },
];

const capabilities = [
  { icon: ShoppingCart, label: 'Sales Quantity', desc: 'Units sold by product' },
  { icon: DollarSign, label: 'Revenue Breakdown', desc: 'Sales & collection data' },
  { icon: SlidersHorizontal, label: 'Advanced Filters', desc: 'Date, store, brand, category' },
  { icon: Activity, label: 'Live Data', desc: 'Real-time report generation' },
];

export default function ReportsIndex() {
  return (
    <div className="space-y-5 sm:space-y-6 pb-6">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-8 sm:py-8"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
          boxShadow: '0 8px 32px 0 rgba(30,27,75,0.28)',
        }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-32 bottom-0 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute left-1/2 -bottom-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition-colors self-start"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="sm:flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs text-indigo-300 font-medium uppercase tracking-widest">Analytics</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-sm text-indigo-300/80 mt-1 max-w-md">
              Gold/platinum sales, inventory quantities, pricing, and profit analysis — all in one place.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span className="text-xs text-white/80 font-medium">4 Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Capability Highlights ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {capabilities.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4 shadow-sm"
          >
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">{label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Report Cards Grid ── */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-widest mb-3">
          Available Reports
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {reportCards.map(({ to, icon: Icon, title, description, gradient, iconBg, tags, stat }) => (
            <Link key={to} to={to} className="group block">
              <div className="relative h-full overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 active:scale-[0.99]">
                {/* Gradient top bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-foreground tabular-nums">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>

                  {/* Title + description */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold">{title}</h2>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom gradient accent on hover */}
                <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
