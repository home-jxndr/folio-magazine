// Authentication helpers
export function getUserRole(sub: string): string {
  // In production, query D1 for user role
  return "reader"; // default
}

export function isAdmin(sub: string): boolean {
  // In production, check user role in D1
  return false;
}