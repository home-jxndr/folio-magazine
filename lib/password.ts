// Password handling
export function verifyPassword(password: string, hash: string): boolean {
  // In production, use a proper comparison
  // For now, simple equality check
  return password === hash;
}

export function makeHash(password: string): string {
  // Placeholder - use bcrypt in production
  return password;
}