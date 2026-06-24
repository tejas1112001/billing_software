import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Plus, Minus, Trash2,
  ArrowLeft, ArrowUpDown, Filter, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchInput } from '@/components/common/SearchInput';
import { PageHeader } from '@/components/common/PageHeader';
import { StoreCombobox } from '@/components/common/StoreCombobox';
import { BillPreviewModal } from '@/components/common/BillPreviewModal';
import { ProductImageCarousel, getProductImages } from '@/components/common/ProductImageCarousel';
import { resolveImageUrl } from '@/utils/imageUrl';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { api } from '@/services/api';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Store, Brand, Category, Product, Order } from '@/types';

function buildCartPayload(product: Product) {
  return {
    productId: product.id,
    modelName: product.modelName,
    imageUrl: resolveImageUrl(product.imageUrl),
    mrp: Number(product.mrp),
    cashPrice: Number(product.cashPrice),
    creditPrice: Number(product.creditPrice),
    availableQty: product.availableQty,
  };
}

function CartSheet({
  items,
  total,
  onUpdateQty,
  onPlaceOrder,
  isPending,
  operatorType,
  hasStore,
}: {
  items: ReturnType<typeof useCart>['items'];
  total: number;
  onUpdateQty: (productId: string, qty: number) => void;
  onPlaceOrder: () => void;
  isPending: boolean;
  operatorType: 'CASH' | 'CREDIT' | null | undefined;
  hasStore: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-xl lg:hidden"
          size="icon"
          disabled={items.length === 0}
          aria-label={`Cart: ${items.length} items`}
        >
          <ShoppingCart className="h-6 w-6" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="h-[80vh] flex flex-col">
        <SheetHeader className="pb-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({items.length} items)
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cart is empty</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-2 border-b last:border-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.modelName} className="h-12 w-12 rounded object-cover shrink-0" loading="lazy" />
                ) : (
                  <div className="h-12 w-12 bg-muted rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.modelName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(operatorType === 'CASH' ? item.cashPrice : item.creditPrice)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onUpdateQty(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onUpdateQty(item.productId, item.quantity + 1)} disabled={item.quantity >= item.availableQty}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onUpdateQty(item.productId, 0)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="shrink-0 pt-3 border-t space-y-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button className="w-full h-12 text-base" onClick={onPlaceOrder} disabled={isPending || !hasStore || items.length === 0}>
              {isPending ? 'Placing Order...' : !hasStore ? 'Select Store First' : 'Place Order'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function GenerateBillPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const { items, addItem, updateQty, clearCart, total } = useCart();

  const getProductPrice = (product: Product): number => {
    if (user?.operatorType === 'CASH') return Number(product.cashPrice);
    if (user?.operatorType === 'CREDIT') return Number(product.creditPrice);
    return Number(product.cashPrice || 0);
  };

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands-all'],
    queryFn: () => brandService.getAll(),
    enabled: !!selectedStore,
  });
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories-by-brand', selectedBrand],
    queryFn: () => categoryService.getByBrand(selectedBrand),
    enabled: !!selectedBrand,
  });
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', selectedStore?.id, selectedBrand, selectedCategory, search, sortOrder],
    queryFn: () => productService.list({
      pageSize: 50,
      inStock: true,
      brandId: selectedBrand && selectedBrand !== '_all' ? selectedBrand : undefined,
      categoryId: selectedCategory && selectedCategory !== '_all' ? selectedCategory : undefined,
      search: search || undefined,
      sortOrder,
    }),
    enabled: !!selectedStore,
  });

  const orderMutation = useMutation({
    mutationFn: () => orderService.create({
      storeId: selectedStore!.id,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    }),
    onSuccess: (order: Order) => {
      setPlacedOrder(order);
      setBillModalOpen(true);
      clearCart();
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: unknown) => {
      const response = (e as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      toast.error((response?.error || 'Failed to place order') + (response?.details ? ` (${response.details})` : ''));
    },
  });

  const handleDownloadPdf = () => {
    if (placedOrder) orderService.downloadPdf(placedOrder.id, placedOrder.billNumber);
  };

  const handleShare = async () => {
    if (!placedOrder) return;
    try {
      const response = await api.get(`/orders/${placedOrder.id}/pdf`, { responseType: 'blob' });
      const blob = response.data;
      if (blob.size === 0) throw new Error('PDF is empty');
      const file = new File([blob], `bill-${placedOrder.billNumber}.pdf`, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Bill ${placedOrder.billNumber}`, files: [file] });
      } else {
        handleDownloadPdf();
      }
    } catch {
      toast.error('Failed to share PDF');
    }
  };

  const handleChangeStore = () => {
    if (items.length > 0 && !window.confirm('Changing store will clear your cart. Continue?')) return;
    setSelectedStore(null);
    clearCart();
    setPlacedOrder(null);
  };

  const products: Product[] = (productsData?.data ?? []).filter((p: Product) => p.availableQty > 0);

  if (!selectedStore) {
    return (
      <div className="max-w-lg mx-auto px-2 py-4">
        <PageHeader title="Generate Bill" description="Select a store to start billing" />
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">Store</Label>
          <StoreCombobox value={selectedStore} onChange={setSelectedStore} />
        </div>
      </div>
    );
  }

  const FilterBar = () => (
    <div className="space-y-2">
      <SearchInput placeholder="Search products..." onChange={setSearch} className="w-full h-10" />
      <div className="grid grid-cols-2 gap-2">
        <Select value={selectedBrand} onValueChange={(v) => { setSelectedBrand(v); setSelectedCategory(''); }}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Brands</SelectItem>
            {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={!selectedBrand || selectedBrand === '_all'}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="h-9 w-full">
        <ArrowUpDown className="h-4 w-4 mr-2" />
        Price {sortOrder === 'asc' ? '↑ Low to High' : '↓ High to Low'}
      </Button>
    </div>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="icon" onClick={handleChangeStore} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="font-bold text-base truncate">{selectedStore.name}</h1>
          <p className="text-xs text-muted-foreground">{selectedStore.city}</p>
        </div>
        <div className="ml-auto shrink-0 hidden lg:flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{items.length} items · {formatCurrency(total)}</span>
        </div>
      </div>

      <BillPreviewModal
        order={placedOrder}
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onDownloadPdf={handleDownloadPdf}
        onShare={handleShare}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full h-10 gap-2">
                  <Filter className="h-4 w-4" />
                  Filter &amp; Search Products
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-t-2xl">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="pt-3"><FilterBar /></div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden lg:block">
            <FilterBar />
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="No products in stock" description="Products with zero stock are hidden from billing." />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {products.map((product) => {
                const inCart = items.find((i) => i.productId === product.id);
                const productImages = getProductImages(product);
                const sellingPrice = getProductPrice(product);
                const stockLow = product.availableQty < 5;

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden flex flex-col border shadow-sm hover:shadow-md transition-shadow rounded-xl"
                  >
                    <div className="relative aspect-square bg-muted">
                      <ProductImageCarousel
                        images={productImages}
                        alt={product.modelName}
                        className="h-full w-full"
                        imageClassName="rounded-t-xl"
                      />
                      {product.isNewArrival && (
                        <Badge className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0 h-4 bg-gradient-to-r from-pink-500 to-purple-500 border-0 gap-0.5 z-30">
                          <Sparkles className="h-2.5 w-2.5" />
                          NEW
                        </Badge>
                      )}
                      <Badge
                        variant={stockLow ? 'warning' : 'success'}
                        className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 h-4 font-semibold tabular-nums z-30"
                      >
                        {product.availableQty} in stock
                      </Badge>
                      {inCart && (
                        <span className="absolute bottom-1.5 right-1.5 h-6 min-w-6 px-1 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold shadow z-30">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>

                    <CardContent className="p-2 sm:p-3 flex flex-col flex-1 gap-2">
                      <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2 text-foreground">
                        {product.modelName}
                      </h3>

                      <div className="rounded-lg bg-muted/40 px-2 py-1.5 space-y-0.5">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">MRP</span>
                          <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                            {formatCurrency(product.mrp)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Selling</span>
                          <span className="font-bold text-sm text-primary tabular-nums">
                            {formatCurrency(sellingPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-0.5" onClick={(e) => e.stopPropagation()}>
                        {inCart ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 shrink-0 rounded-lg"
                              onClick={() => updateQty(product.id, inCart.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="flex-1 text-center text-sm font-bold tabular-nums">{inCart.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 shrink-0 rounded-lg"
                              onClick={() => updateQty(product.id, inCart.quantity + 1)}
                              disabled={inCart.quantity >= product.availableQty}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full h-8 sm:h-9 text-xs font-semibold rounded-lg shadow-sm"
                            onClick={() => addItem(buildCartPayload(product))}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <div className="p-4 border-b flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-semibold text-sm">Cart ({items.length})</span>
            </div>
            <div className="p-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-2 text-sm">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" loading="lazy" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-xs">{item.modelName}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatCurrency(user?.operatorType === 'CASH' ? item.cashPrice : item.creditPrice)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                          <span className="w-4 text-center text-xs font-medium">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.productId, item.quantity + 1)} disabled={item.quantity >= item.availableQty}><Plus className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => updateQty(item.productId, 0)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                    <Button className="w-full h-10" onClick={() => orderMutation.mutate()} disabled={orderMutation.isPending || !selectedStore || items.length === 0}>
                      {orderMutation.isPending ? 'Placing...' : 'Place Order'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <CartSheet
        items={items}
        total={total}
        onUpdateQty={updateQty}
        onPlaceOrder={() => orderMutation.mutate()}
        isPending={orderMutation.isPending}
        operatorType={user?.operatorType}
        hasStore={!!selectedStore}
      />
    </div>
  );
}
