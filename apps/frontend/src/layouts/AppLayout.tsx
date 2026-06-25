import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt, BookOpen, BarChart3,
  Settings, Menu, X, LogOut, User, Zap, ChevronDown, FileBarChart,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
import { UserMenu } from '@/components/common/UserMenu';
import { cn } from '@/lib/utils';

type NavChild = { to: string; label: string; end?: boolean };

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  end?: boolean;
  children?: NavChild[];
};

const billingChildren: NavChild[] = [
  { to: '/bills', label: 'New Bill', end: true },
  { to: '/bills/generated', label: 'Generated Bills', end: false },
];

const receiptChildren: NavChild[] = [
  { to: '/receipts', label: 'New Receipt', end: true },
  { to: '/receipts/generated', label: 'Generated Receipts', end: false },
];

const operatorNav: NavItem[] = [
  { id: 'dashboard', to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { id: 'billing', icon: FileText, label: 'Billing', children: billingChildren },
  { id: 'receipts', icon: Receipt, label: 'Receipts', children: receiptChildren },
  { id: 'ledger', to: '/ledger', icon: BookOpen, label: 'Ledger' },
];

const adminNav: NavItem[] = [
  { id: 'dashboard', to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { id: 'billing', icon: FileText, label: 'Billing', children: billingChildren },
  { id: 'receipts', icon: Receipt, label: 'Receipts', children: receiptChildren },
  { id: 'stock', to: '/stock-reports', icon: BarChart3, label: 'Stock Report' },
  { id: 'ledger', to: '/ledger', icon: BookOpen, label: 'Ledger' },
  { id: 'admin', to: '/admin', icon: Settings, label: 'Admin Panel' },
];

const adminReportItems: NavChild[] = [
  { to: '/reports', label: 'All Reports', end: true },
  { to: '/reports/cash-credit', label: 'Gold and Platinum', end: false },
  { to: '/reports/purchase-quantity', label: 'Purchases Qty', end: false },
  { to: '/reports/profit', label: 'Profit Report', end: false },
  { to: '/reports/product', label: 'Product Report', end: false },
];

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.children) {
    return item.children.some((c) =>
      c.end ? pathname === c.to : pathname.startsWith(c.to)
    );
  }
  if (!item.to) return false;
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    billing: true,
    receipts: false,
    reports: false,
  });
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenSections((prev) => ({
      ...prev,
      billing: location.pathname.startsWith('/bills') ? true : prev.billing,
      receipts: location.pathname.startsWith('/receipts') ? true : prev.receipts,
      reports: location.pathname.startsWith('/reports') ? true : prev.reports,
    }));
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  const navItems = user?.role === 'ADMIN' ? adminNav : operatorNav;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#4f46e5] flex items-center justify-center shrink-0 shadow-md">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-tight">Software</h2>
            <p className="text-[10px] text-indigo-300 leading-tight">Management System</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="mx-3 border-t border-white/10 shrink-0" />

      <nav className="flex-1 p-3 pt-2 space-y-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, location.pathname);

          if (item.children) {
            const isOpen = openSections[item.id] ?? false;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative min-h-[44px]',
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-white/80" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', openSections[item.id] && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1 pb-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[40px]',
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.to!}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative min-h-[44px]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                    : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-white/80" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {user?.role === 'ADMIN' && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleSection('reports')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]',
                location.pathname.startsWith('/reports')
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <FileBarChart className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Reports</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', openSections.reports && 'rotate-180')} />
            </button>
            {openSections.reports && (
              <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1 pb-1">
                {adminReportItems.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[40px]',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0 safe-area-pb">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/10 border border-white/10 mb-2">
          <div className="h-9 w-9 rounded-full bg-[#4f46e5] flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-xs text-indigo-300 capitalize">{user?.role?.toLowerCase()}</p>
              {user?.operatorType && (
                <Badge variant={user.operatorType === 'CASH' ? 'success' : 'warning'} className="text-[10px] h-4 px-1.5">
                  {getOperatorTypeDisplay(user.operatorType)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[#f87171] hover:text-[#fca5a5] hover:bg-red-500/10 transition-colors min-h-[44px]"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 h-[100dvh] overflow-hidden bg-background">
      <aside className="hidden lg:flex w-64 flex-col shrink-0 bg-[#1e1b4b] border-r border-[#e5e3fb]">
        <SidebarContent />
      </aside>

      <div className={cn(
        'fixed inset-0 z-50 lg:hidden transition-all duration-300',
        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
        <aside className={cn(
          'absolute left-0 top-0 h-full w-[min(290px,85vw)] flex flex-col bg-[#1e1b4b] border-r border-[#e5e3fb] z-10 transition-transform duration-350 ease-out shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <SidebarContent />
        </aside>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 sm:h-16 flex items-center gap-3 px-4 sm:px-5 border-b border-[#e5e3fb] bg-white shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold lg:hidden text-primary truncate">Software</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2 sm:gap-3">
            {user?.operatorType && (
              <Badge variant={user.operatorType === 'CASH' ? 'success' : 'warning'} className="text-[10px] sm:text-xs px-2 py-0.5 font-semibold">
                {getOperatorTypeDisplay(user.operatorType)}
              </Badge>
            )}
            <div className="h-5 w-px bg-[#e5e3fb] mx-1 shrink-0" />
            <div className="hidden sm:block">
              <UserMenu variant="default" />
            </div>
            <div className="sm:hidden">
              <UserMenu variant="compact" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
