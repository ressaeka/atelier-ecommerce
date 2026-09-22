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

// ─── Error ──────────────────────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
