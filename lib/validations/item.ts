import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((s) => (s == null || s === "" ? undefined : String(s).trim() || undefined));

export const itemSchema = z.object({
  name: z
    .string()
    .transform((s) => (typeof s === "string" ? s.trim() : ""))
    .refine((s) => s.length > 0, "שם הפריט נדרש"),
  description: optionalString,
  price: z.coerce.number().min(0, "מחיר חייב להיות 0 ומעלה"),
  currency: z.string().default("ILS"),
  is_active: z.boolean().default(true),
});

export type ItemInput = z.infer<typeof itemSchema>;
