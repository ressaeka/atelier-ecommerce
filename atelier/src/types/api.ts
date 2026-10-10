// ─── API Response Envelope ──────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Auth ───────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
}

// ─── Product ────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string;
  categoryId: number;
  category?: Category;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

// ─── Category ───────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Cart ───────────────────────────────────────────────────
export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  product: Product;
  variant: ProductVariant | null;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
  variantId?: number | null;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ─── Wishlist ───────────────────────────────────────────────
export interface WishlistItem {
  id: number;
  wishlistId: number;
  productId: number;
  product: Product;
  createdAt: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Address ────────────────────────────────────────────────
export interface Address {
  id: number;
  userId: number;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface AddressPaginationResponse {
  items: Address[];
  meta: PaginationMeta;
}

// ─── Forgot Password ───────────────────────────────────────
export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

// ─── Order ──────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentMethodCode =
  | 'GOPAY'
  | 'VIRTUAL_ACCOUNT'
  | 'SHOPEEPAY'
  | 'OVO'
  | 'DANA'
  | 'QRIS';

export interface Payment {
  id: number;
  orderId: number;
  provider: string;
  midtransOrderId: string;
  snapToken?: string | null;
  attempt: number;
  status: PaymentStatus;
  /** Present on newer records after Midtrans webhook mapping */
  paymentMethod?: PaymentMethodCode | null;
  transactionStatus?: string | null;
  fraudStatus?: string | null;
  grossAmount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItemProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemVariant {
  id: number;
  productId: number;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  price: number;
  subtotal: number;
  product: OrderItemProduct;
  variant: OrderItemVariant | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  items: OrderItem[];
  /** Latest payment attempt (hanya di GET /order/:id) */
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderPaginationResponse {
  data: Order[];
  meta: PaginationMeta;
}

export interface CreateOrderRequest {
  addressId: number;
}

export type OrderSortBy = 'createdAt' | 'total' | 'status';
export type OrderSortOrder = 'asc' | 'desc';

export interface OrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  userId?: number;
  status?: OrderStatus;
  sortBy?: OrderSortBy;
  sortOrder?: OrderSortOrder;
}

// ─── Payment (Midtrans) ─────────────────────────────────────
export interface CreatePaymentRequest {
  orderId: number;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  midtransOrderId: string;
  snapToken: string;
  redirectUrl: string;
}

// ─── Error ──────────────────────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// ─── Sales Report ───────────────────────────────────────────
export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
}

export interface SalesReportDailyTrend {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface SalesReportTransactionItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant: string | null;
}

export interface SalesReportTransaction {
  id: number;
  orderNumber: string;
  createdAt: string;
  dateWib: string;
  recipientName: string;
  phone: string;
  city: string;
  province: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  isRevenue: boolean;
  paymentMethod: PaymentMethodCode | null;
  paymentStatus: PaymentStatus | null;
  itemsCount: number;
  items: SalesReportTransactionItem[];
}

export interface SalesReportResponse {
  period: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  summary: SalesReportSummary;
  statusDistribution: Record<OrderStatus, number>;
  dailyTrends: SalesReportDailyTrend[];
  transactions: {
    data: SalesReportTransaction[];
    meta: PaginationMeta;
  };
}

export interface SalesReportQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Best Selling Products Report ───────────────────────────
export interface BestSellingProduct {
  rank: number;
  productId: number;
  name: string;
  image: string | null;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
  averageSellingPrice: number;
  currentPrice: number;
  currentStock: number;
}

export interface BestSellingSummary {
  totalUnitsSold: number;
  totalRevenue: number;
  totalUniqueProducts: number;
  totalOrdersWithProducts: number;
}

export interface BestSellingResponse {
  period: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  summary: BestSellingSummary;
  products: {
    data: BestSellingProduct[];
    meta: PaginationMeta;
  };
}

export interface BestSellingQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'sold' | 'revenue' | 'orderCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ─── Customer Report ────────────────────────────────────────
export interface CustomerReportItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  registeredAt: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  hasPurchasedInPeriod: boolean;
}

export interface CustomerReportSummary {
  totalRegisteredCustomers: number;
  newRegisteredCustomers: number;
  activePurchasingCustomers: number;
  inactiveCustomersInPeriod: number;
  totalOrders: number;
  totalRevenue: number;
  averageSpentPerCustomer: number;
  purchasingCustomerRatio: number;
}

export interface CustomerReportResponse {
  period: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  summary: CustomerReportSummary;
  customers: {
    data: CustomerReportItem[];
    meta: PaginationMeta;
  };
}

export interface CustomerReportQuery {
  startDate?: string;
  endDate?: string;
  customerType?: 'all' | 'active' | 'inactive';
  search?: string;
  sortBy?: 'totalSpent' | 'totalOrders' | 'name' | 'registeredAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}



