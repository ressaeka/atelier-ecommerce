import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Dummy bcrypt hash for timing-safe credential checks.
 * Generated once at runtime (not hardcoded in source).
 */
let dummyPasswordHashPromise: Promise<string> | null = null;

export const getDummyPasswordHash = (): Promise<string> => {
  if (!dummyPasswordHashPromise) {
    dummyPasswordHashPromise = hashPassword(
      `timing-safe-placeholder-${randomUUIDSafe()}`,
    );
  }
  return dummyPasswordHashPromise;
};

function randomUUIDSafe(): string {
  // Avoid importing crypto here for minimal surface; use a random suffix.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
