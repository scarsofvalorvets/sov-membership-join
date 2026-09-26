/** Stable key for a 1:1 conversation between two members (order-independent). */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}
