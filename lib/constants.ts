/**
 * קבועים כלליים של האפליקציה
 */

export const APP_NAME = "ניהול חשבונות";

export const INVOICE_PREFIX = "INV";
export const QUOTE_PREFIX = "QUO";
export const PAYMENT_REQUEST_PREFIX = "DR";

export const DEFAULT_CURRENCY = "ILS";
export const DEFAULT_LANGUAGE = "he";

/** תבנית חופשית בתחתית כל המסמכים */
export const DOCUMENT_DISCLAIMER =
  "* אישורי בטיחות, אישורי מהנדס וביטוחים הינם באחריותו של הלקוח בלבד.";

export const PAYMENT_STATUSES = [
  { value: "pending", label: "ממתין לתשלום" },
  { value: "partially_paid", label: "שולם חלקית" },
  { value: "paid", label: "שולם במלואו" },
  { value: "cancelled", label: "בוטל" },
] as const;

export const PAYMENT_REQUEST_STATUSES = [
  { value: "draft", label: "טיוטה" },
  { value: "sent", label: "נשלחה" },
  { value: "paid", label: "שולמה" },
  { value: "converted", label: "הומרה לחשבונית" },
  { value: "cancelled", label: "בוטלה" },
] as const;

export const QUOTE_STATUSES = [
  { value: "draft", label: "טיוטא" },
  { value: "sent", label: "נשלחה" },
  { value: "accepted", label: "אושרה" },
  { value: "rejected", label: "נדחתה" },
  { value: "expired", label: "פג תוקף" },
] as const;

export const CLIENT_TYPES = [
  { value: "casual", label: "מזדמן" },
  { value: "regular", label: "קבוע" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "מזומן" },
  { value: "bank_transfer", label: "העברה בנקאית" },
  { value: "credit_card", label: "כרטיס אשראי" },
  { value: "bit_paybox", label: "ביט/פייבוקס" },
  { value: "check", label: "צ'ק" },
  { value: "other", label: "אחר" },
] as const;
