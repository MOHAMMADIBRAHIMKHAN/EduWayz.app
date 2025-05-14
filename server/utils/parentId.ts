/**
 * Generates a unique parent ID in the format: PO-YYNNNNN
 * where YY is the last 2 digits of the current year
 * and NNNNN is a sequential number starting from 0001
 */
export function generateParentId(lastId?: string): string {
   const now = new Date()
   const currentYear = now.getFullYear().toString();

   // Get Month Abbrecations (Jan , Feb , Mar )
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth =  monthNames[now.getMonth()]
if (!lastId) {
    // If no previous ID exists, start with 00001
    return `PO-${currentYear}-${currentMonth}-00001`;
  }
  
  // Check if the lastId follows the new format with year and month abbreviation
  if (lastId.includes('-') && lastId.split('-').length === 4) {
    // Extract the parts from the last ID
    const parts = lastId.split('-');
    const lastYear = parts[1];
    const lastMonth = parts[2];
    const lastNumber = parseInt(parts[3]);
    
    // If year and month match current, just increment the number
    if (lastYear === currentYear && lastMonth === currentMonth) {
      // Increment and pad with leading zeros to 5 digits
      const nextNumber = (lastNumber + 1).toString().padStart(5, '0');
      return `PO-${currentYear}-${currentMonth}-${nextNumber}`;
    } else {
      // If year or month changed, start a new sequence
      return `PO-${currentYear}-${currentMonth}-00001`;
    }
  } else if (lastId.includes('-') && lastId.split('-').length === 3) {
    // Handle transition from previous format (PO-YYYY-NNNNN)
    // Start a new sequence with the year and month
    return `PO-${currentYear}-${currentMonth}-00001`;
  } else {
    // Handle legacy format (PO-YYNNNNN)
    // Start a new sequence with the year and month
    return `PO-${currentYear}-${currentMonth}-00001`;
  }
}
