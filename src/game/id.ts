export function createId(prefix: string): string {
  const randomPart = crypto.getRandomValues(new Uint32Array(2)).join('');
  return `${prefix}-${Date.now()}-${randomPart}`;
}
