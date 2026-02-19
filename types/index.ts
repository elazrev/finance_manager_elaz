// Database Types
export interface User {
  id: string;
  email: string;
  business_name?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  is_patour: boolean;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  invoice_prefix?: string;
  quote_prefix?: string;
  payment_request_prefix?: string;
  currency?: string;
  language?: string;
  payment_terms?: number;
  email_signature?: string;
  whatsapp_enabled?: boolean;
  /** טקסט בתחתית מסמכים */
  document_footer?: string | null;
  /** לוגו – data URL או URL לתמונה. יופיע במרכז העליון של המסמך */
  logo_url?: string | null;
  /** חתימה – data URL או URL לתמונה */
  signature_url?: string | null;
  /** צבע ראשי למסמכים (עתידי) */
  document_primary_color?: string | null;
  /** צבע משני למסמכים (עתידי) */
  document_accent_color?: string | null;
  /** הצגת פרטי מנפיק: "row" = שורה אחת, "column" = טורית (רשימה מתחת לשם העסק) */
  issuer_details_layout?: "row" | "column";
  /** הצגת תאריך עריכה במסמכים שנערכו */
  show_edit_date_on_documents?: boolean;
  /** ערכת נושא: "light" | "dark" | "system" */
  theme?: "light" | "dark" | "system";
  /** צבע ערכת נושא – פלטות מוגדרות מראש */
  themeColor?: "blue" | "amber" | "emerald" | "violet" | "rose" | "slate";
  /** גודל טקסט באפליקציה: sm, md (ברירת מחדל), lg */
  fontSize?: "sm" | "md" | "lg";
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  identity_number?: string;
  client_type: "casual" | "regular";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id?: string;
  invoice_number: string;
  type: "invoice" | "receipt" | "credit";
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  payment_method?: string;
  payment_status: "pending" | "partially_paid" | "paid" | "cancelled";
  due_date?: string;
  paid_at?: string;
  notes?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  client_id?: string;
  quote_number: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  valid_until?: string;
  notes?: string;
  sent_at?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  client_id?: string;
  request_number: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: "draft" | "sent" | "paid" | "converted" | "cancelled";
  due_date?: string;
  notes?: string;
  converted_invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  category: string;
  supplier?: string;
  description?: string;
  receipt_reference?: string;
  attachment_url?: string;
  vat_included: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
