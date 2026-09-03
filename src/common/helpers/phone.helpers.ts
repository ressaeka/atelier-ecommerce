export function normalizePhone(phone: string): string {
  const value = phone.trim();

  if (value.startsWith('08')) {
    return `+62${value.slice(1)}`;
  }

  if (value.startsWith('62')) {
    return `+${value}`;
  }

  return value;
}
