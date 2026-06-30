import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, KeyRound, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { userService } from '@/services/userService';
import { usePagination } from '@/hooks/usePagination';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
import type { AppUser, Role, OperatorType } from '@/types';

// ── Permission module definitions ───────────────────────────────────────────
const MODULE_PERMISSIONS = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'BILLING',   label: 'Billing' },
  { key: 'RECEIPTS',  label: 'Receipts' },
  { key: 'LEDGER',    label: 'Ledger' },
] as const;

type PermissionKey = typeof MODULE_PERMISSIONS[number]['key'];

// ── Zod schemas ──────────────────────────────────────────────────────────────
const VALID_PERMISSIONS = ['DASHBOARD', 'BILLING', 'RECEIPTS', 'LEDGER'] as const;

const createSchema = z.object({
  username: z.string().min(3, 'Min 3 chars'),
  password: z.string().min(6, 'Min 6 chars'),
  role: z.enum(['ADMIN', 'OPERATOR']),
  operatorType: z.enum(['CASH', 'CREDIT']).optional(),
  permissions: z.array(z.enum(VALID_PERMISSIONS)).optional(),
});

const editSchema = z.object({
  username: z.string().min(3, 'Min 3 chars').optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  operatorType: z.enum(['CASH', 'CREDIT']).nullable().optional(),
  permissions: z.array(z.enum(VALID_PERMISSIONS)).optional(),
  isActive: z.boolean().optional(),
});

const resetSchema = z.object({
  password: z.string().min(6, 'Min 6 chars'),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;
type ResetForm = z.infer<typeof resetSchema>;

// ── PermissionCheckboxes sub-component ──────────────────────────────────────
function PermissionCheckboxes({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((p) => p !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div>
      <Label className="flex items-center gap-1.5 mb-2">
        <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
        Module Permissions
      </Label>
      <div className="grid grid-cols-2 gap-2 p-3 rounded-md border bg-muted/30">
        {MODULE_PERMISSIONS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              id={`perm-${key}`}
              checked={value.includes(key)}
              onCheckedChange={() => toggle(key)}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, search],
    queryFn: () => userService.list({ page, pageSize, search: search || undefined }),
  });

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: { role: 'OPERATOR', permissions: [] } });
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const createMut = useMutation({
    mutationFn: (d: CreateForm) => userService.create(d as Parameters<typeof userService.create>[0]),
    onSuccess: (u) => { toast.success(`User "${u.username}" created`); setCreateOpen(false); createForm.reset(); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'),
  });

  const editMut = useMutation({
    mutationFn: (d: EditForm) => userService.update(editUser!.id, d),
    onSuccess: () => { toast.success('User updated'); setEditUser(null); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update'),
  });

  const resetMut = useMutation({
    mutationFn: (d: ResetForm) => userService.resetPassword(resetUser!.id, d.password),
    onSuccess: () => { toast.success('Password reset'); setResetUser(null); resetForm.reset(); },
    onError: () => toast.error('Failed to reset password'),
  });

  const deleteMut = useMutation({
    mutationFn: () => userService.delete(deleteId!),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to delete user');
      setDeleteId(null);
    },
  });

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    editForm.reset({
      username: u.username,
      role: u.role,
      operatorType: u.operatorType ?? undefined,
      permissions: (u.permissions ?? []) as PermissionKey[],
      isActive: u.isActive,
    });
  };

  const watchRole = createForm.watch('role');
  const editWatchRole = editForm.watch('role');
  const createPerms = createForm.watch('permissions') ?? [];
  const editPerms = editForm.watch('permissions') ?? [];

  const columns: ColumnDef<AppUser>[] = [
    { key: 'username', header: 'Username', cell: (r) => <span className="font-medium">{r.username}</span> },
    {
      key: 'role', header: 'Role',
      cell: (r) => <Badge variant={r.role === 'ADMIN' ? 'default' : 'secondary'}>{r.role}</Badge>,
    },
    {
      key: 'operatorType', header: 'Type',
      cell: (r) => r.operatorType
        ? <Badge variant={r.operatorType === 'CASH' ? 'success' : 'warning'}>{getOperatorTypeDisplay(r.operatorType)}</Badge>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: 'permissions', header: 'Permissions',
      cell: (r) => {
        if (r.role === 'ADMIN') {
          return <span className="text-xs text-muted-foreground italic">All access</span>;
        }
        const perms: string[] = r.permissions ?? [];
        if (perms.length === 0) {
          return <span className="text-xs text-muted-foreground">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {perms.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-indigo-600 border-indigo-200 bg-indigo-50">
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'isActive', header: 'Status',
      cell: (r) => <Badge variant={r.isActive ? 'success' : 'destructive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', header: 'Actions',
      cell: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setResetUser(r); resetForm.reset(); }}><KeyRound className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
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
        title="User Management"
        description="Manage operators and admins"
        actions={
          <Button onClick={() => { setCreateOpen(true); createForm.reset({ role: 'OPERATOR', permissions: [] }); }} size="sm" className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm sm:gap-2">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      {/* Search */}
      <div className="flex gap-2">
        <SearchInput
          placeholder="Search username..."
          onChange={(v) => {
            setSearch(v);
            reset();
          }}
          className="flex-1"
        />
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={(data?.data || []) as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as AppUser).id}
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

      {/* ── Create dialog ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <form onSubmit={createForm.handleSubmit((d) => createMut.mutate(d))} className="space-y-3 pt-1">
            <div>
              <Label>Username</Label>
              <Input {...createForm.register('username')} className="mt-1 h-10" />
              {createForm.formState.errors.username && <p className="text-xs text-destructive mt-0.5">{createForm.formState.errors.username.message}</p>}
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" {...createForm.register('password')} className="mt-1 h-10" />
              {createForm.formState.errors.password && <p className="text-xs text-destructive mt-0.5">{createForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <Label>Role</Label>
              <Select value={watchRole} onValueChange={(v) => createForm.setValue('role', v as Role)}>
                <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {watchRole === 'OPERATOR' && (
              <>
                <div>
                  <Label>Operator Type</Label>
                  <Select value={createForm.watch('operatorType') ?? ''} onValueChange={(v) => createForm.setValue('operatorType', v as OperatorType)}>
                    <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Gold</SelectItem>
                      <SelectItem value="CREDIT">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <PermissionCheckboxes
                  value={createPerms as string[]}
                  onChange={(v) => createForm.setValue('permissions', v as PermissionKey[])}
                />
              </>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User — {editUser?.username}</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit((d) => editMut.mutate(d))} className="space-y-3 pt-1">
            <div>
              <Label>Username</Label>
              <Input {...editForm.register('username')} className="mt-1 h-10" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editWatchRole ?? ''} onValueChange={(v) => editForm.setValue('role', v as Role)}>
                <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editWatchRole === 'OPERATOR' && (
              <>
                <div>
                  <Label>Operator Type</Label>
                  <Select value={editForm.watch('operatorType') ?? ''} onValueChange={(v) => editForm.setValue('operatorType', v ? v as OperatorType : null)}>
                    <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Gold</SelectItem>
                      <SelectItem value="CREDIT">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <PermissionCheckboxes
                  value={editPerms as string[]}
                  onChange={(v) => editForm.setValue('permissions', v as PermissionKey[])}
                />
              </>
            )}
            <div className="flex items-center justify-between py-1">
              <Label>Active</Label>
              <Switch
                checked={editForm.watch('isActive') ?? true}
                onCheckedChange={(v) => editForm.setValue('isActive', v)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" disabled={editMut.isPending}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reset password dialog ─────────────────────────────────────── */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password — {resetUser?.username}</DialogTitle></DialogHeader>
          <form onSubmit={resetForm.handleSubmit((d) => resetMut.mutate(d))} className="space-y-3 pt-1">
            <div>
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 6 characters" {...resetForm.register('password')} className="mt-1 h-10" />
              {resetForm.formState.errors.password && <p className="text-xs text-destructive mt-0.5">{resetForm.formState.errors.password.message}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
              <Button type="submit" disabled={resetMut.isPending}>Reset Password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
