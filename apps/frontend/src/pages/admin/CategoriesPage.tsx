import React, { useState, useRef } from 'react';
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
import { ImageUpload } from '@/components/common/ImageUpload';
import { ImageThumbnail } from '@/components/common/ImageThumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categoryService } from '@/services/categoryService';
import { brandService } from '@/services/brandService';
import { uploadImage } from '@/services/uploadService';
import { usePagination } from '@/hooks/usePagination';
import type { Category, Brand } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  brandId: z.string().min(1, 'Brand required'),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pendingImageFile = useRef<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, pageSize],
    queryFn: () => categoryService.list({ page, pageSize }),
  });
  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands-all'],
    queryFn: () => brandService.getAll(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const selectedBrandId = watch('brandId');

  const createMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) => categoryService.create(d),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['categories'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) =>
      categoryService.update(editItem!.id, d),
    onSuccess: () => {
      toast.success('Category updated');
      qc.invalidateQueries({ queryKey: ['categories'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMut = useMutation({
    mutationFn: () => categoryService.delete(deleteId!),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Cannot delete category with products');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditItem(null);
    pendingImageFile.current = null;
    setCurrentImageUrl(null);
    resetForm({ name: '', brandId: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditItem(c);
    pendingImageFile.current = null;
    setCurrentImageUrl(c.imageUrl ?? null);
    resetForm({ name: c.name, brandId: c.brandId });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    pendingImageFile.current = null;
    setCurrentImageUrl(null);
  };

  const onSubmit = async (d: FormData) => {
    try {
      let imageUrl: string | null = currentImageUrl;

      if (pendingImageFile.current) {
        imageUrl = await uploadImage(pendingImageFile.current);
      }

      const payload = { ...d, imageUrl };

      if (editItem) {
        updateMut.mutate(payload);
      } else {
        createMut.mutate(payload);
      }
    } catch {
      toast.error('Image upload failed');
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      cell: (r) => <ImageThumbnail src={r.imageUrl} alt={r.name} />,
    },
    { key: 'name', header: 'Category Name' },
    { key: 'brand', header: 'Brand', cell: (r) => r.brand?.name || '-' },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setDeleteId(r.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        }
      />
      <DataTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
        data={(data?.data || []) as Record<string, unknown>[]}
        isLoading={isLoading}
        getRowKey={(r) => (r as unknown as Category).id}
      />
      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Brand</Label>
              <Select value={selectedBrandId} onValueChange={(v) => setValue('brandId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId && (
                <p className="text-xs text-destructive">{errors.brandId.message}</p>
              )}
            </div>
            <div>
              <Label>Category Image</Label>
              <div className="mt-1">
                <ImageUpload
                  value={currentImageUrl}
                  onChange={(file, previewUrl) => {
                    pendingImageFile.current = file;
                    if (!file) {
                      setCurrentImageUrl(null);
                    } else if (previewUrl) {
                      setCurrentImageUrl(previewUrl);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Category"
        description="This will delete the category."
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
