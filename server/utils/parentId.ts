/**
 * Generates a unique parent ID in the format: PO-YYNNNNN
 * where YY is the last 2 digits of the current year
 * and NNNNN is a sequential number starting from 0001
 */
export function generateParentId(lastId?: string): string {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  if (!lastId) {
    return `PO-${currentYear}0001`;
  }
  
  // Extract the sequential number from the last ID
  const lastNumber = parseInt(lastId.slice(-4));
  
  // Increment and pad with leading zeros
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  
  return `PO-${currentYear}${nextNumber}`;
}
