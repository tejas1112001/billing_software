import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { storeService } from '@/services/storeService';
import { usePagination } from '@/hooks/usePagination';
import type { Store } from '@/types';

const schema = z.object({
  name: z.string().min(1), address: z.string().min(1), city: z.string().min(1),
  pincode: z.string().min(1), mobile: z.string().min(10), email: z.string().email(),
});
type FormData = z.infer<typeof schema>;

export default function StoresPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Store | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['stores', page, pageSize], queryFn: () => storeService.list({ page, pageSize }) });
  const { register, handleSubmit, reset: resetForm, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMut = useMutation({ mutationFn: (d: FormData) => storeService.create(d), onSuccess: () => { toast.success('Store created'); qc.invalidateQueries({ queryKey: ['stores'] }); closeDialog(); }, onError: () => toast.error('Failed') });
  const updateMut = useMutation({ mutationFn: (d: FormData) => storeService.update(editItem!.id, d), onSuccess: () => { toast.success('Store updated'); qc.invalidateQueries({ queryKey: ['stores'] }); closeDialog(); }, onError: () => toast.error('Failed') });
  const deleteMut = useMutation({ mutationFn: () => storeService.delete(deleteId!), onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['stores'] }); setDeleteId(null); }, onError: () => { toast.error('Cannot delete store'); setDeleteId(null); } });

  const openCreate = () => { setEditItem(null); resetForm(); setDialogOpen(true); };
  const openEdit = (s: Store) => { setEditItem(s); resetForm(s); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  const columns: ColumnDef<Store>[] = [
    { key: 'name', header: 'Store Name' },
    { key: 'city', header: 'City' },
    { key: 'mobile', header: 'Mobile' },
    { key: 'email', header: 'Email' },
    {
      key: 'actions', header: 'Actions',
      cell: (r) => (<div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4" /></Button></div>)
    },
  ];

  const fields: Array<{ name: keyof FormData; label: string; type?: string }> = [
    { name: 'name', label: 'Store Name' }, { name: 'address', label: 'Address' },
    { name: 'city', label: 'City' }, { name: 'pincode', label: 'Pincode' },
    { name: 'mobile', label: 'Mobile Number' }, { name: 'email', label: 'Email', type: 'email' },
  ];

  return (
    <div>
      <PageHeader title="Stores" actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Store</Button>} />
      <DataTable columns={columns as unknown as ColumnDef<Record<string, unknown>>[]} data={(data?.data || []) as Record<string, unknown>[]} isLoading={isLoading} getRowKey={(r) => (r as unknown as Store).id} />
      {data && <Pagination page={page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Store' : 'Add Store'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => editItem ? updateMut.mutate(d) : createMut.mutate(d))} className="space-y-3">
            {fields.map(({ name, label, type }) => (
              <div key={name}><Label>{label}</Label><Input type={type} {...register(name)} />{errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}</div>
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Store" description="Delete this store?" onConfirm={() => deleteMut.mutate()} loading={deleteMut.isPending} />
    </div>
  );
}

