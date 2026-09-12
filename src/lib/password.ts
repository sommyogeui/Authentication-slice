import bcrypt from "bcrypt";

// 12 salt rounds provides robust defense against brute-force attacks
// while maintaining fast response times for genuine users (~250ms).
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with 12 rounds of salting.
 * Plaintext passwords are never logged, stored, or leaked.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * Constant-time comparison prevents timing attacks.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
