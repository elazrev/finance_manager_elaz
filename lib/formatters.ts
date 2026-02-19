/**
 * פורמט כסף לשקלים
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₪0.00";
  }
  
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `₪${amount.toFixed(2)}`;
  }
}

/**
 * פורמט תאריך עברי
 */
export function formatHebrewDate(date: Date): string {
  // TODO: Implement Hebrew date formatting using date-fns or hebrew-calendar
  return date.toLocaleDateString("he-IL");
}

/**
 * פורמט תאריך רגיל
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "לא זמין";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "תאריך לא תקין";
    }
    
    return dateObj.toLocaleDateString("he-IL");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "תאריך לא תקין";
  }
}
