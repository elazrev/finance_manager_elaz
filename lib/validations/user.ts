import { z } from "zod";

export const userSettingsSchema = z.object({
  invoice_prefix: z.string().max(10).optional(),
  quote_prefix: z.string().max(10).optional(),
  payment_request_prefix: z.string().max(10).optional(),
  currency: z.string().max(10).optional(),
  language: z.string().max(10).optional(),
  payment_terms: z.number().int().min(0).optional(),
  email_signature: z.string().optional(),
  whatsapp_enabled: z.boolean().optional(),
  /** טקסט בתחתית מסמכים (חשבוניות, הצעות, דרישות תשלום) */
  document_footer: z.string().max(1000).optional().nullable(),
  logo_url: z.string().max(500000).optional().nullable(),
  signature_url: z.string().max(500000).optional().nullable(),
  document_primary_color: z.string().max(20).optional().nullable(),
  document_accent_color: z.string().max(20).optional().nullable(),
  /** "row" = שורה אחת, "column" = רשימה טורית מתחת לשם העסק */
  issuer_details_layout: z.enum(["row", "column"]).optional(),
  /** הצגת תאריך עריכה במסמכים שנערכו */
  show_edit_date_on_documents: z.boolean().optional(),
  /** ערכת נושא */
  theme: z.enum(["light", "dark", "system"]).optional(),
  /** צבע ערכת נושא */
  themeColor: z.enum(["blue", "amber", "emerald", "violet", "rose", "slate"]).optional(),
  /** גודל טקסט */
  fontSize: z.enum(["sm", "md", "lg"]).optional(),
});

export const userUpdateSchema = z.object({
  business_name: z.string().max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  tax_id: z.string().max(20).optional().nullable(),
  settings: userSettingsSchema.optional(),
});

/** סכמה שטוחה לטופס (כולל שדות settings) */
export const userFormSchema = z.object({
  business_name: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  tax_id: z.string().max(20).optional(),
  invoice_prefix: z.string().max(10).optional(),
  quote_prefix: z.string().max(10).optional(),
  payment_request_prefix: z.string().max(10).optional(),
  payment_terms: z.coerce.number().int().min(0).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  themeColor: z.enum(["blue", "amber", "emerald", "violet", "rose", "slate"]).optional(),
  fontSize: z.enum(["sm", "md", "lg"]).optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserFormInput = z.infer<typeof userFormSchema>;
