export function getUnitPrice(txn: any): number {
  const migrated = (txn as any).unitPriceAtPurchase;
  if (migrated !== undefined && migrated !== null) return Number(migrated);

  const legacy = txn?.pricePerLiter;
  if (legacy !== undefined && legacy !== null) return Number(legacy);

  const total = txn?.totalAmount;
  const qty = txn?.quantity;
  if (total != null && qty) return Number(total) / Number(qty);

  return 0;
}
