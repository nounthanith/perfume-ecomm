export function formatCurrency(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}