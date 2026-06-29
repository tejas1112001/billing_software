import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowLeft, FileSpreadsheet, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { exportToExcel, exportToPdf } from '@/utils/exportUtils';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ImageThumbnail } from '@/components/common/ImageThumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { categoryService } from '@/services/categoryService';
import { brandService } from '@/services/brandService';
import { uploadImage, getUploadErrorMessage } from '@/services/uploadService';
import { usePagination } from '@/hooks/usePagination';
import type { Category, Brand } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  brandIds: z.array(z.string()).optional().default([]),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');

  const pendingImageFile = useRef<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllForExport = async () => {
    setIsExporting(true);
    try {
      const res = await categoryService.list({ page: 1, pageSize: 10000, search: search || undefined });
      return res.data as Record<string, unknown>[];
    } finally {
      setIsExporting(false);
    }
  };

  const exportColumns = [
    { header: 'Category Name', accessor: 'name', width: 25 },
    {
      header: 'Brands Mapped',
      accessor: (r: Record<string, unknown>) => {
        const mappedBrands = (r.brands as Array<{ name: string }>) ?? [];
        return mappedBrands.length === 0 ? '—' : mappedBrands.map((b) => b.name).join(', ');
      },
      width: 40,
    },
  ];

  const handleExportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      exportToExcel(rows, exportColumns, `Categories_Export_${new Date().toISOString().slice(0, 10)}`);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      const rows = await fetchAllForExport();
      exportToPdf(rows, exportColumns, {
        title: 'Product Categories List',
        subtitle: `Total Categories: ${rows.length}`,
        filename: `Categories_Export_${new Date().toISOString().slice(0, 10)}`,
        orientation: 'portrait',
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to export PDF');
    }
  };


  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, pageSize, search],
    queryFn: () => categoryService.list({ page, pageSize, search: search || undefined }),
  });
  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands-all'],
    queryFn: () => brandService.getAll(),
  });

  const filteredBrands = (brands ?? []).filter((b) =>
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', brandIds: [] },
  });

  const createMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) => categoryService.create(d),
    onSuccess: () => {
      toast.success('Category created');
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-by-brand'] });
      closeDialog();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string; details?: unknown } } })?.response?.data?.error;
      toast.error(msg || 'Failed to create category');
    },
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) =>
      categoryService.update(editItem!.id, d),
    onSuccess: () => {
      toast.success('Category updated');
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-by-brand'] });
      closeDialog();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string; details?: unknown } } })?.response?.data?.error;
      toast.error(msg || 'Failed to update category');
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => categoryService.delete(deleteId!),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-by-brand'] });
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
    resetForm({ name: '', brandIds: [] });
    setBrandSearchQuery('');
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditItem(c);
    pendingImageFile.current = null;
    setCurrentImageUrl(c.imageUrl ?? null);
    resetForm({ name: c.name, brandIds: c.brands?.map((b) => b.id) ?? [] });
    setBrandSearchQuery('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    pendingImageFile.current = null;
    setCurrentImageUrl(null);
    setBrandSearchQuery('');
  };

  const onSubmit = async (d: FormData) => {
    try {
      let imageUrl: string | null = currentImageUrl;

      if (pendingImageFile.current) {
        setIsUploading(true);
        imageUrl = await uploadImage(pendingImageFile.current);
      }

      const payload = { ...d, imageUrl };

      if (editItem) {
        updateMut.mutate(payload);
      } else {
        createMut.mutate(payload);
      }
    } catch (error) {
      toast.error(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      cell: (r) => <ImageThumbnail src={r.imageUrl} alt={r.name} />,
    },
    { key: 'name', header: 'Category Name' },
    {
      key: 'brand',
      header: 'Brands Mapped',
      cell: (r) => {
        const mappedBrands = r.brands ?? [];
        if (mappedBrands.length === 0) return '-';
        return mappedBrands.map((b) => b.name).join(', ');
      },
    },
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
        title="Categories"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm"
              title="Export to PDF"
            >
              <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button onClick={openCreate} size="sm" className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm sm:gap-2">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="flex gap-2">
        <SearchInput
          placeholder="Search categories..."
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
          data={(data?.data || []) as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as Category).id}
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
            <div className="space-y-2">
              <Label>Select Brand</Label>
              <div className="flex flex-col gap-2 rounded-md border p-3 bg-slate-50/50">
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 mt-1">
                  {filteredBrands?.map((b) => {
                    const currentIds = watch('brandIds') ?? [];
                    const checked = currentIds.includes(b.id);
                    return (
                      <label key={b.id} className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:bg-slate-100/50 p-1.5 rounded transition">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('brandIds', [...currentIds, b.id]);
                            } else {
                              setValue('brandIds', currentIds.filter((id) => id !== b.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{b.name}</span>
                      </label>
                    );
                  })}
                  {(!filteredBrands || filteredBrands.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">No matching brands</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label>Category Image</Label>
              <div className="mt-1">
                <ImageUpload
                  value={currentImageUrl}
                  disabled={isUploading || isSubmitting}
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
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save'}
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
