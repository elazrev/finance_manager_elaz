import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().min(1, "תיאור נדרש"),
  quantity: z.number().min(0.01, "כמות חייבת להיות גדולה מ-0"),
  unit_price: z.number().min(0, "מחיר יחידה חייב להיות חיובי"),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const createQuoteSchema = z.object({
  client_id: z
    .union([z.string().uuid("לקוח לא תקין"), z.literal("")])
    .optional()
    .transform((v) => (v === "" || !v ? undefined : v)),
  /** שם לקוח חופשי – אם לא נבחר client_id, שם זה יהפוך ללקוח זמני */
  client_name: z
    .string()
    .optional()
    .transform((s) => (typeof s === "string" ? s.trim() : "") || undefined),
  items: z.array(quoteItemSchema).min(1, "יש להוסיף לפחות פריט אחד"),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
