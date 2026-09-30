import { api } from './api';
import type {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressPaginationResponse,
} from '../types/api';

/**
 * Fetch list of addresses for current user.
 * Handles both paginated response ({ items: [...], meta }) and flat array.
 */
export async function getAddresses(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Address[]> {
  const res = await api.get<AddressPaginationResponse | Address[]>('/address', params);
  if (Array.isArray(res)) return res;
  return res?.items ?? [];
}

/**
 * Fetch default address for current user.
 */
export async function getDefaultAddress(): Promise<Address | null> {
  try {
    return await api.get<Address>('/address/default');
  } catch {
    return null;
  }
}

/**
 * Fetch address by ID.
 */
export async function getAddressById(id: number): Promise<Address> {
  return await api.get<Address>(`/address/${id}`);
}

/**
 * Create a new address for current user.
 */
export async function createAddress(data: CreateAddressRequest): Promise<Address> {
  return await api.post<Address>('/address', data);
}

/**
 * Update existing address by ID.
 */
export async function updateAddress(
  id: number,
  data: UpdateAddressRequest,
): Promise<Address> {
  return await api.patch<Address>(`/address/${id}`, data);
}

/**
 * Delete address by ID.
 */
export async function deleteAddress(id: number): Promise<Address> {
  return await api.delete<Address>(`/address/${id}`);
}
