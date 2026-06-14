import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  imageUrl: z.string().url().optional().nullable(),
});

export const UpdateBrandSchema = CreateBrandSchema.partial();

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  brandId: z.string().min(1, 'Brand is required'),
  imageUrl: z.string().url().optional().nullable(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  email: z.string().email('Valid email is required'),
});

export const UpdateStoreSchema = CreateStoreSchema.partial();

export const CreateProductSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url().optional().nullable(),
  mrp: z.number().positive('MRP must be positive'),
  nlc: z.number().positive('NLC must be positive'),
  availableQty: z.number().int().min(0, 'Quantity cannot be negative'),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const CreateOrderSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  customerName: z.string().optional().default('Walk-in Customer'),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
});

export const CreateReceiptSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  customerName: z.string().optional().default('Walk-in Customer'),
  paymentMode: z.enum(['CASH', 'UPI']),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
});

export const OpeningBalanceSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateReceiptInput = z.infer<typeof CreateReceiptSchema>;
export type OpeningBalanceInput = z.infer<typeof OpeningBalanceSchema>;
