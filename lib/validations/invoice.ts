import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "תיאור נדרש"),
  quantity: z.number().min(0.01, "כמות חייבת להיות גדולה מ-0"),
  unit_price: z.number().min(0, "מחיר יחידה חייב להיות חיובי"),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const createInvoiceSchema = z
  .object({
    client_id: z
      .union([z.string().uuid("לקוח לא תקין"), z.literal("")])
      .optional()
      .transform((v) => (v === "" || !v ? undefined : v)),
    type: z.enum(["invoice", "receipt", "credit"]).default("invoice"),
    items: z.array(invoiceItemSchema).min(1, "יש להוסיף לפחות פריט אחד"),
    payment_method: z.string().optional(),
    payment_status: z.enum(["pending", "partially_paid", "paid", "cancelled"]).default("pending"),
    paid_at: z.string().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.payment_status !== "paid") return true;
      return Boolean(data.payment_method && data.payment_method.trim() !== "");
    },
    { message: "בחשבונית ששולמה במלואה חובה לציין אמצעי תשלום (כנדרש בחוק)", path: ["payment_method"] }
  );

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
