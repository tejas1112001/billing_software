export type Role = 'ADMIN' | 'OPERATOR';
export type VoucherType = 'ORDER' | 'RECEIPT';
export type PaymentMode = 'CASH' | 'UPI';
export type LogAction =
  | 'LOGIN'
  | 'BILL_CREATION'
  | 'RECEIPT_CREATION'
  | 'PRODUCT_CREATION'
  | 'PRODUCT_UPDATE'
  | 'BRAND_CREATION'
  | 'CATEGORY_CREATION'
  | 'STORE_CREATION';

export interface User {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  mobile: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string | null;
  brandId: string;
  brand?: Brand;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  modelName: string;
  imageUrl?: string | null;
  mrp: string | number;
  nlc: string | number;
  availableQty: number;
  brandId: string;
  brand?: Brand;
  categoryId: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
}

export interface Order {
  id: string;
  billNumber: string;
  customerName: string;
  storeId: string;
  store?: Store;
  userId: string;
  user?: User;
  totalAmount: string | number;
  createdAt: string;
  orderItems?: OrderItem[];
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  storeId: string;
  store?: Store;
  userId: string;
  user?: User;
  paymentMode: PaymentMode;
  amount: string | number;
  date: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  storeId: string;
  store?: Store;
  voucherType: VoucherType;
  amount: string | number;
  customerName: string;
  orderId?: string | null;
  order?: Order | null;
  receiptId?: string | null;
  receipt?: Receipt | null;
  date: string;
  createdAt: string;
  // Computed fields
  openingBalance?: number;
  currentTotal?: number;
  closingBalance?: number;
  billSerialNumber?: string;
}

export interface OpeningBalance {
  id: string;
  storeId: string;
  amount: string | number;
  updatedAt: string;
}

export interface UserLog {
  id: string;
  userId: string;
  user?: User;
  action: LogAction;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    role: Role;
  };
}

export interface DashboardStats {
  totalOrdersToday: number;
  totalReceiptsToday: number;
  lowStockProducts: number;
  activeStores: number;
}
