import { z } from "zod";

const itemSchema = z.object({
  description: z.string().min(1, "תיאור נדרש"),
  quantity: z.number().min(0.01, "כמות חייבת להיות גדולה מ-0"),
  unit_price: z.number().min(0, "מחיר יחידה חייב להיות חיובי"),
  discount: z.number().min(0).max(100).optional(),
});

export const createPaymentRequestSchema = z.object({
  client_id: z
    .union([z.string().uuid("לקוח לא תקין"), z.literal("")])
    .optional()
    .transform((v) => (v === "" || !v ? undefined : v)),
  items: z.array(itemSchema).min(1, "יש להוסיף לפחות פריט אחד"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentRequestInput = z.infer<typeof createPaymentRequestSchema>;
