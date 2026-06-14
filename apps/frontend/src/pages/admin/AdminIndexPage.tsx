import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Grid, Store, Package, Activity, CreditCard, Users, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

const adminSections = [
  { to: '/admin/brands', icon: Tag, title: 'Brands', description: 'Manage product brands', color: 'bg-blue-100 text-blue-600' },
  { to: '/admin/categories', icon: Grid, title: 'Categories', description: 'Manage product categories', color: 'bg-purple-100 text-purple-600' },
  { to: '/admin/stores', icon: Store, title: 'Stores', description: 'Manage store locations', color: 'bg-green-100 text-green-600' },
  { to: '/admin/products', icon: Package, title: 'Products', description: 'Manage inventory', color: 'bg-orange-100 text-orange-600' },
  { to: '/admin/users', icon: Users, title: 'Users', description: 'Manage operators & admins', color: 'bg-indigo-100 text-indigo-600' },
  { to: '/admin/payment-methods', icon: CreditCard, title: 'Payment Methods', description: 'Manage payment types', color: 'bg-emerald-100 text-emerald-600' },
  { to: '/admin/user-logs', icon: Activity, title: 'Audit Logs', description: 'Full system audit trail', color: 'bg-red-100 text-red-600' },
  { to: '/ledger', icon: BookOpen, title: 'Ledgers', description: 'All store ledgers', color: 'bg-yellow-100 text-yellow-600' },
];

export default function AdminIndexPage() {
  return (
    <div>
      <PageHeader title="Admin Panel" description="System configuration and management" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {adminSections.map(({ to, icon: Icon, title, description, color }) => (
          <Link key={to} to={to}>
            <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full active:scale-95">
              <CardHeader className="p-4 pb-2">
                <div className={`p-2.5 rounded-lg w-fit ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-sm mb-0.5">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
