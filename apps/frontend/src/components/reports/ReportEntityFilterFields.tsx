import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportFilterValue } from '@/utils/reportFilters';
import type { Product } from '@/types';

interface ReportEntityFilterFieldsProps {
  startDate: string;
  endDate: string;
  brandId: string;
  categoryId: string;
  storeId: string;
  productId: string;
  brands?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  stores?: { id: string; name: string }[];
  products?: Product[];
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onStoreChange: (v: string) => void;
  onProductChange: (v: string) => void;
}

export function ReportEntityFilterFields({
  startDate,
  endDate,
  brandId,
  categoryId,
  storeId,
  productId,
  brands = [],
  categories = [],
  stores = [],
  products = [],
  onStartDateChange,
  onEndDateChange,
  onBrandChange,
  onCategoryChange,
  onStoreChange,
  onProductChange,
}: ReportEntityFilterFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="report-start-date" className="text-xs font-medium">Start Date</Label>
        <Input
          id="report-start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="report-end-date" className="text-xs font-medium">End Date</Label>
        <Input
          id="report-end-date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Brand</Label>
        <Select value={brandId || 'all'} onValueChange={onBrandChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Category</Label>
        <Select
          value={categoryId || 'all'}
          onValueChange={onCategoryChange}
          disabled={!reportFilterValue(brandId)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Product</Label>
        <Select value={productId || 'all'} onValueChange={onProductChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>{product.modelName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Store</Label>
        <Select value={storeId || 'all'} onValueChange={onStoreChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All Stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
