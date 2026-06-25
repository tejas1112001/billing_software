import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { MultiImageUpload, type PendingImage } from '@/components/common/MultiImageUpload';
import { ImageThumbnail } from '@/components/common/ImageThumbnail';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { uploadImage, getUploadErrorMessage } from '@/services/uploadService';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Product, Brand, Category } from '@/types';

const schema = z.object({
  modelName: z.string().min(1, 'Required'),
  brandId: z.string().min(1, 'Required'),
  categoryId: z.string().min(1, 'Required'),
  mrp: z.coerce.number().positive('MRP must be positive'),
  cashPrice: z.coerce.number().positive('Gold Price must be positive'),
  creditPrice: z.coerce.number().positive('Platinum Price must be positive'),
  purchasePrice: z.coerce.number().positive('Purchase Price must be positive').optional().or(z.literal(0)),
  availableQty: z.coerce.number().int().min(0, 'Cannot be negative'),
  isNewArrival: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProductsPage() {
  const qc = useQueryClient();
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [productImages, setProductImages] = useState<PendingImage[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    mutationFn: (d: FormData & { imageUrl?: string | null; images?: string[]; thumbnailUrl?: string | null }) =>
      productService.create(d),
    onSuccess: () => {
      toast.success('Product created');
      qc.invalidateQueries({ queryKey: ['products'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMut = useMutation({
    mutationFn: (d: FormData & { imageUrl?: string | null; images?: string[]; thumbnailUrl?: string | null }) =>
      productService.update(editItem!.id, d),
    onSuccess: () => {
      toast.success('Product updated');
      qc.invalidateQueries({ queryKey: ['products'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMut = useMutation({
    mutationFn: () => productService.delete(deleteId!),
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Cannot delete product that has been used in orders');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditItem(null);
    setProductImages([]);
    setThumbnailUrl(null);
    resetForm({ 
      modelName: '', 
      brandId: '', 
      categoryId: '', 
      mrp: 0, 
      cashPrice: 0, 
      creditPrice: 0, 
      purchasePrice: 0,
      availableQty: 0,
      isNewArrival: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    const existingImages =
      p.images && p.images.length > 0
        ? p.images.map((img) => ({
            id: img.id,
            url: img.url,
            previewUrl: img.url,
            isExisting: true,
          }))
        : p.imageUrl
          ? [{ id: 'legacy', url: p.imageUrl, previewUrl: p.imageUrl, isExisting: true }]
          : [];
    setProductImages(existingImages);
    setThumbnailUrl(p.imageUrl ?? existingImages[0]?.url ?? null);
    resetForm({
      modelName: p.modelName,
      brandId: p.brandId,
      categoryId: p.categoryId,
      mrp: Number(p.mrp),
      cashPrice: Number(p.cashPrice),
      creditPrice: Number(p.creditPrice),
      purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : 0,
      availableQty: p.availableQty,
      isNewArrival: p.isNewArrival || false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setProductImages([]);
    setThumbnailUrl(null);
  };

  const onSubmit = async (d: FormData) => {
    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (const img of productImages) {
        if (img.isExisting) {
          uploadedUrls.push(img.url);
        } else if (img.file) {
          uploadedUrls.push(await uploadImage(img.file));
        }
      }

      let resolvedThumbnail = uploadedUrls[0] ?? null;
      if (thumbnailUrl) {
        const thumbIndex = productImages.findIndex(
          (img) => img.url === thumbnailUrl || img.previewUrl === thumbnailUrl
        );
        if (thumbIndex >= 0) {
          resolvedThumbnail = uploadedUrls[thumbIndex] ?? resolvedThumbnail;
        }
      }

      const payload = {
        ...d,
        imageUrl: resolvedThumbnail,
        images: uploadedUrls,
        thumbnailUrl: resolvedThumbnail,
      };

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

  const columns: ColumnDef<Product>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      cell: (r) => <ImageThumbnail src={r.imageUrl} alt={r.modelName} />,
    },
    { 
      key: 'modelName', 
      header: 'Model',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span>{r.modelName}</span>
          {r.isNewArrival && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-gradient-to-r from-pink-500 to-purple-500">
              NEW
            </Badge>
          )}
        </div>
      ),
    },
    { key: 'brand', header: 'Brand', cell: (r) => r.brand?.name || '-' },
    { key: 'category', header: 'Category', cell: (r) => r.category?.name || '-' },
    { key: 'mrp', header: 'MRP', cell: (r) => formatCurrency(r.mrp) },
    { key: 'cashPrice', header: 'Gold Price', cell: (r) => formatCurrency(r.cashPrice) },
    { key: 'creditPrice', header: 'Platinum Price', cell: (r) => formatCurrency(r.creditPrice) },
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
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(r.id)}>
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
        title="Products"
        actions={
          <Button onClick={openCreate} size="sm" className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm sm:gap-2">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />
      
      <div className="mb-4">
        <SearchInput
          placeholder="Search products by name, brand, or category..."
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
          getRowKey={(r) => (r as unknown as Product).id}
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
              <Label className="text-xs sm:text-sm">Product Images</Label>
              <p className="text-[10px] text-muted-foreground mb-1">
                First image is the default thumbnail. Tap the star to change it.
              </p>
              <div className="mt-1">
                <MultiImageUpload
                  images={productImages}
                  thumbnailUrl={thumbnailUrl}
                  disabled={isUploading || isSubmitting}
                  onChange={(images, thumb) => {
                    setProductImages(images);
                    setThumbnailUrl(thumb);
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-xs sm:text-sm">MRP</Label>
                <Input type="number" step="0.01" {...register('mrp')} className="h-8 sm:h-9 mt-1" />
                {errors.mrp && <p className="text-xs text-destructive">{errors.mrp.message}</p>}
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Gold Price</Label>
                <Input type="number" step="0.01" {...register('cashPrice')} className="h-8 sm:h-9 mt-1" />
                {errors.cashPrice && <p className="text-xs text-destructive">{errors.cashPrice.message}</p>}
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Platinum Price</Label>
                <Input type="number" step="0.01" {...register('creditPrice')} className="h-8 sm:h-9 mt-1" />
                {errors.creditPrice && <p className="text-xs text-destructive">{errors.creditPrice.message}</p>}
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Purchase Price (Optional)</Label>
                <Input type="number" step="0.01" {...register('purchasePrice')} className="h-8 sm:h-9 mt-1" placeholder="0.00" />
                {errors.purchasePrice && <p className="text-xs text-destructive">{errors.purchasePrice.message}</p>}
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Quantity</Label>
                <Input type="number" {...register('availableQty')} className="h-8 sm:h-9 mt-1" />
                {errors.availableQty && <p className="text-xs text-destructive">{errors.availableQty.message}</p>}
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isNewArrival"
                  {...register('isNewArrival')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isNewArrival" className="text-xs sm:text-sm cursor-pointer">
                  Mark as New Arrival
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading} size="sm">
                {isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
