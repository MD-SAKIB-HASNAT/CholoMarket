/** Builds a CHECK expression like `"status" IN ('a','b')`. */
export function inList(column: string, values: readonly string[]): string {
  return `"${column}" IN (${values.map((v) => `'${v}'`).join(', ')})`;
}
