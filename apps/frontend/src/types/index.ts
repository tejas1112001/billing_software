export type Role = 'ADMIN' | 'OPERATOR';
export type OperatorType = 'CASH' | 'CREDIT';
export type VoucherType = 'ORDER' | 'RECEIPT';
export type PaymentMode = 'CASH' | 'UPI';
export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type LogAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'BILL_CREATION'
  | 'RECEIPT_CREATION'
  | 'PRODUCT_CREATION'
  | 'PRODUCT_UPDATE'
  | 'BRAND_CREATION'
  | 'CATEGORY_CREATION'
  | 'STORE_CREATION'
  | 'USER_CREATION'
  | 'PAYMENT_METHOD_CREATION'
  | 'PAYMENT_METHOD_UPDATE';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  mobile: string;
  email: string;
}

export interface Brand {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string | null;
  brandId: string;
  brand?: Brand;
  brands?: Brand[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  modelName: string;
  imageUrl?: string | null;
  images?: ProductImage[];
  mrp: number | string;
  cashPrice: number | string;
  creditPrice: number | string;
  purchasePrice?: number | string | null;
  availableQty: number;
  isNewArrival?: boolean;
  brandId: string;
  brand?: Brand;
  categoryId: string;
  category?: Category;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

export interface Order {
  id: string;
  billNumber: string;
  customerName?: string | null;
  storeId: string;
  store?: Store;
  userId?: string;
  user?: { id: string; username: string; operatorType?: OperatorType | null };
  totalAmount: number | string;
  discountType?: DiscountType | null;
  discountValue?: number | string | null;
  discountAppliedBy?: string | null;
  discountAdmin?: { id: string; username: string } | null;
  createdAt: string;
  orderItems?: OrderItem[];
  itemCount?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  storeId: string;
  store?: Store;
  userId?: string;
  user?: { id: string; username: string; operatorType?: OperatorType | null };
  paymentMode: PaymentMode;
  paymentMethodId?: string | null;
  paymentMethod?: PaymentMethod | null;
  amount: number | string;
  date: string;
  customerName?: string | null;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  storeId: string;
  voucherType: VoucherType;
  amount: number | string;
  customerName?: string | null;
  date: string;
  openingBalance?: number;
  currentTotal?: number;
  closingBalance?: number;
  billSerialNumber?: string;
  orderId?: string | null;
  receiptId?: string | null;
}

export interface UserLog {
  id: string;
  userId: string;
  user?: { id: string; username: string };
  action: LogAction;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  role: Role;
  operatorType?: OperatorType | null;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalOrdersToday: number;
  totalReceiptsToday: number;
  lowStockProducts: number;
  activeStores: number;
  totalSalesToday: number;
  totalCollectedToday: number;
  totalSalesThisMonth: number;
  totalCollectedThisMonth: number;
  totalOutstanding: number;
}

export interface OperatorStat {
  id: string;
  username: string;
  operatorType: OperatorType | null;
  ordersToday: number;
  receiptsToday: number;
  salesToday: number;
  collectedToday: number;
  recentActivity: Array<{ action: LogAction; createdAt: string; meta?: Record<string, unknown> | null }>;
}

export interface PersonalStats {
  ordersToday: number;
  receiptsToday: number;
  salesToday: number;
  totalBillsGenerated: number;
  totalReceiptsGenerated: number;
  totalSales: number;
  totalCollected: number;
  recentOrders: Order[];
  weeklyTrends: WeeklyTrendDay[];
}

export interface WeeklyTrendDay {
  label: string;
  sales: number;
  collected: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  modelName: string;
  brandName: string;
  totalQty: number;
  totalRevenue: number;
}

export interface ActivityLog {
  id: string;
  action: LogAction;
  meta?: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; username: string; operatorType?: OperatorType | null };
}
