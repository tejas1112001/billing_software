import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { ImageUpload } from '@/components/common/ImageUpload';
import { ImageThumbnail } from '@/components/common/ImageThumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { uploadImage } from '@/services/uploadService';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Product, Brand, Category } from '@/types';

const schema = z.object({
  modelName: z.string().min(1, 'Required'),
  brandId: z.string().min(1, 'Required'),
  categoryId: z.string().min(1, 'Required'),
  mrp: z.coerce.number().positive('MRP must be positive'),
  nlc: z.coerce.number().positive('NLC must be positive'),
  availableQty: z.coerce.number().int().min(0, 'Cannot be negative'),
});
type FormData = z.infer<typeof schema>;

export default function ProductsPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);

  const pendingImageFile = useRef<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, search],
    queryFn: () => productService.list({ page, pageSize, search }),
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
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories-by-brand', selectedBrandId],
    queryFn: () => categoryService.getByBrand(selectedBrandId),
    enabled: !!selectedBrandId,
  });

  const createMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) => productService.create(d),
    onSuccess: () => {
      toast.success('Product created');
      qc.invalidateQueries({ queryKey: ['products'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null }) =>
      productService.update(editItem!.id, d),
    onSuccess: () => {
      toast.success('Product updated');
      qc.invalidateQueries({ queryKey: ['products'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update product'),
  });

  const openCreate = () => {
    setEditItem(null);
    pendingImageFile.current = null;
    setCurrentImageUrl(null);
    resetForm({ modelName: '', brandId: '', categoryId: '', mrp: 0, nlc: 0, availableQty: 0 });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    pendingImageFile.current = null;
    setCurrentImageUrl(p.imageUrl ?? null);
    resetForm({
      modelName: p.modelName,
      brandId: p.brandId,
      categoryId: p.categoryId,
      mrp: Number(p.mrp),
      nlc: Number(p.nlc),
      availableQty: p.availableQty,
    });
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

  const columns: ColumnDef<Product>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      cell: (r) => <ImageThumbnail src={r.imageUrl} alt={r.modelName} />,
    },
    { key: 'modelName', header: 'Model' },
    { key: 'brand', header: 'Brand', cell: (r) => r.brand?.name || '-' },
    { key: 'category', header: 'Category', cell: (r) => r.category?.name || '-' },
    { key: 'mrp', header: 'MRP', cell: (r) => formatCurrency(r.mrp) },
    { key: 'nlc', header: 'NLC', cell: (r) => formatCurrency(r.nlc) },
    {
      key: 'availableQty',
      header: 'Qty',
      cell: (r) => (
        <Badge variant={r.availableQty < 5 ? 'warning' : 'success'}>{r.availableQty}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <Button onClick={openCreate} size="sm" className="h-8 sm:h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      />
      <div className="mb-3">
        <SearchInput
          placeholder="Search products..."
          onChange={(v) => {
            setSearch(v);
            reset();
          }}
        />
      </div>
      <DataTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
        data={(data?.data || []) as Record<string, unknown>[]}
        isLoading={isLoading}
        getRowKey={(r) => (r as unknown as Product).id}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3">
            <div>
              <Label className="text-xs sm:text-sm">Model Name</Label>
              <Input {...register('modelName')} className="h-8 sm:h-9 mt-1" />
              {errors.modelName && (
                <p className="text-xs text-destructive">{errors.modelName.message}</p>
              )}
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Brand</Label>
              <Select
                value={watch('brandId')}
                onValueChange={(v) => {
                  setValue('brandId', v);
                  setValue('categoryId', '');
                }}
              >
                <SelectTrigger className="h-8 sm:h-9 mt-1">
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
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Category</Label>
              <Select
                value={watch('categoryId')}
                onValueChange={(v) => setValue('categoryId', v)}
                disabled={!selectedBrandId}
              >
                <SelectTrigger className="h-8 sm:h-9 mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Product Image</Label>
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
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm">MRP</Label>
                <Input type="number" step="0.01" {...register('mrp')} className="h-8 sm:h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">NLC</Label>
                <Input type="number" step="0.01" {...register('nlc')} className="h-8 sm:h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Qty</Label>
                <Input type="number" {...register('availableQty')} className="h-8 sm:h-9 mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
