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
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SearchInput } from '@/components/common/SearchInput';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ImageThumbnail } from '@/components/common/ImageThumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { brandService } from '@/services/brandService';
import { uploadImage, getUploadErrorMessage } from '@/services/uploadService';
import { usePagination } from '@/hooks/usePagination';
import type { Brand } from '@/types';

const schema = z.object({ name: z.string().min(1, 'Name required') });
type FormData = z.infer<typeof schema>;

export default function BrandsPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Track pending image file and current image URL separately from react-hook-form
  const pendingImageFile = useRef<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllForExport = async () => {
    setIsExporting(true);
    try {
      const res = await brandService.list({ page: 1, pageSize: 10000, search });
      return res.data as Record<string, unknown>[];
    } finally {
      setIsExporting(false);
    }
  };

  const exportColumns = [
    { header: 'Brand Name', accessor: 'name', width: 25 },
  ];

  const handleExportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      exportToExcel(rows, exportColumns, `Brands_Export_${new Date().toISOString().slice(0, 10)}`);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      const rows = await fetchAllForExport();
      exportToPdf(rows, exportColumns, {
        title: 'Product Brands List',
        subtitle: `Total Brands: ${rows.length}`,
        filename: `Brands_Export_${new Date().toISOString().slice(0, 10)}`,
        orientation: 'portrait',
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to export PDF');
    }
  };


  const { data, isLoading } = useQuery({
    queryKey: ['brands', page, pageSize, search],
    queryFn: () => brandService.list({ page, pageSize, search }),
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) => brandService.create(d),
    onSuccess: () => {
      toast.success('Brand created');
      qc.invalidateQueries({ queryKey: ['brands'] });
      closeDialog();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to create brand');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) =>
      brandService.update(editBrand!.id, d),
    onSuccess: () => {
      toast.success('Brand updated');
      qc.invalidateQueries({ queryKey: ['brands'] });
      closeDialog();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to update brand');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => brandService.delete(deleteId!),
    onSuccess: () => {
      toast.success('Brand deleted');
      qc.invalidateQueries({ queryKey: ['brands'] });
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Cannot delete brand');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditBrand(null);
    pendingImageFile.current = null;
    setCurrentImageUrl(null);
    resetForm({ name: '' });
    setDialogOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditBrand(b);
    pendingImageFile.current = null;
    setCurrentImageUrl(b.imageUrl ?? null);
    resetForm({ name: b.name });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditBrand(null);
    pendingImageFile.current = null;
    setCurrentImageUrl(null);
  };

  const onSubmit = async (d: FormData) => {
    try {
      let imageUrl: string | null = currentImageUrl;

      if (pendingImageFile.current) {
        setIsUploading(true);
        imageUrl = await uploadImage(pendingImageFile.current);
      }

      const payload = { ...d, imageUrl };

      if (editBrand) {
        updateMutation.mutate(payload);
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      toast.error(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      cell: (row) => <ImageThumbnail src={row.imageUrl} alt={row.name} />,
    },
    { key: 'name', header: 'Brand Name' },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setDeleteId(row.id)}
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
        title="Brands"
        description="Manage product brands"
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
              <span className="hidden sm:inline">Add Brand</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        }
      />
      <div className="mb-4">
        <SearchInput
          placeholder="Search brands..."
          onChange={(v) => {
            setSearch(v);
            reset();
          }}
        />
      </div>
      
      <div className="rounded-lg border bg-card shadow-sm">
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={(data?.data || []) as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as Brand).id}
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
            <DialogTitle>{editBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input {...register('name')} placeholder="e.g. Samsung" />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label>Brand Image</Label>
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
        title="Delete Brand"
        description="This will permanently delete the brand."
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
