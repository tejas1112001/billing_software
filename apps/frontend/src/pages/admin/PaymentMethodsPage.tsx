import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Power, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { paymentMethodService } from '@/services/paymentMethodService';
import type { PaymentMethod } from '@/types';

export default function PaymentMethodsPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editItem, setEditItem] = useState<PaymentMethod | null>(null);
  const [editName, setEditName] = useState('');

  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods-admin'],
    queryFn: () => paymentMethodService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: (name: string) => paymentMethodService.create(name),
    onSuccess: (pm) => {
      toast.success(`"${pm.name}" added`);
      setNewName('');
      qc.invalidateQueries({ queryKey: ['payment-methods-admin'] });
      qc.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to add';
      toast.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isActive?: boolean } }) =>
      paymentMethodService.update(id, data),
    onSuccess: () => {
      toast.success('Updated');
      setEditItem(null);
      qc.invalidateQueries({ queryKey: ['payment-methods-admin'] });
      qc.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMut.mutate(newName.trim());
  };

  const handleEditSave = () => {
    if (!editItem || !editName.trim()) return;
    updateMut.mutate({ id: editItem.id, data: { name: editName.trim() } });
  };

  const toggleActive = (pm: PaymentMethod) => {
    updateMut.mutate({ id: pm.id, data: { isActive: !pm.isActive } });
  };

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-5 lg:space-y-6">
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
      
      <PageHeader title="Payment Methods" description="Manage accepted payment types" />

      {/* Add form */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="newMethod" className="sr-only">New payment method</Label>
              <Input
                id="newMethod"
                placeholder="e.g. Cash, UPI, Credit Card..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={createMut.isPending || !newName.trim()} className="h-10 gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Methods list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : methods.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No payment methods yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {methods.map((pm) => (
            <div
              key={pm.id}
              className={`flex items-center gap-3 p-3.5 rounded-lg border bg-card ${!pm.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{pm.name}</p>
                <Badge variant={pm.isActive ? 'success' : 'secondary'} className="text-xs mt-0.5">
                  {pm.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Edit name"
                  onClick={() => { setEditItem(pm); setEditName(pm.name); }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-8 w-8 ${pm.isActive ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}`}
                  title={pm.isActive ? 'Deactivate' : 'Activate'}
                  onClick={() => toggleActive(pm)}
                  disabled={updateMut.isPending}
                >
                  {pm.isActive ? <Trash2 className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={updateMut.isPending || !editName.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
