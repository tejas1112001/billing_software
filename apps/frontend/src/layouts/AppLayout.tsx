import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt, BookOpen, BarChart3,
  Settings, Menu, X, LogOut, User, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';

// Operator sees: dashboard, generate bill, generate receipt, ledger, own logs
const operatorNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/bills', icon: FileText, label: 'Generate Bill', end: false },
  { to: '/receipts', icon: Receipt, label: 'Generate Receipt', end: false },
  { to: '/ledger', icon: BookOpen, label: 'Ledger', end: false },
];

// Admin sees: dashboard + full admin panel
const adminNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/stock-reports', icon: BarChart3, label: 'Stock Report', end: false },
  { to: '/ledger', icon: BookOpen, label: 'Ledger', end: false },
  { to: '/admin', icon: Settings, label: 'Admin Panel', end: false },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  };

  const navItems = user?.role === 'ADMIN' ? adminNavItems : operatorNavItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / brand — aligned with main header height */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Logo avatar */}
          <div className="h-8 w-8 rounded-lg bg-[#4f46e5] flex items-center justify-center shrink-0 shadow-md">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-tight">Tripigotales</h2>
            <p className="text-[10px] text-indigo-300 leading-tight">Management System</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Thin divider below logo */}
      <div className="mx-3 border-t border-white/10 shrink-0" />

      {/* Nav items */}
      <nav className="flex-1 p-3 pt-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-[#4f46e5] text-white shadow-sm'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Left accent bar on active */}
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-white/70" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card + logout */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-md bg-white/10 border border-white/10 mb-2">
          <div className="h-8 w-8 rounded-full bg-[#4f46e5] flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-indigo-300 capitalize">{user?.role?.toLowerCase()}</p>
              {user?.operatorType && (
                <Badge variant={user.operatorType === 'CASH' ? 'success' : 'warning'} className="text-xs h-4 px-1">
                  {user.operatorType}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[#f87171] hover:text-[#fca5a5] hover:bg-red-500/10 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 h-screen overflow-hidden bg-background" style={{ width: '100%', margin: 0, padding: 0 }}>
      {/* Desktop sidebar — dark indigo, sits flush against header */}
      <aside className="hidden lg:flex w-60 flex-col shrink-0 bg-[#1e1b4b] border-r border-[#e5e3fb]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-[#1e1b4b] border-r border-[#e5e3fb] z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header — taller, more breathing room */}
        <header className="h-16 flex items-center gap-3 px-5 border-b border-[#e5e3fb] bg-white shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold lg:hidden text-primary">Tripigotales</span>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-3">
            {user?.operatorType && (
              <Badge variant={user.operatorType === 'CASH' ? 'success' : 'warning'} className="text-xs">
                {user.operatorType}
              </Badge>
            )}
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold leading-tight">{user?.username}</p>
                <p className="text-[10px] text-muted-foreground leading-tight capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
