import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((s) => (s == null || s === "" ? undefined : String(s).trim() || undefined));

const optionalEmail = z
  .string()
  .optional()
  .transform((s) => (typeof s === "string" ? s.trim() : "") || undefined)
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "אימייל לא תקין");

export const clientSchema = z.object({
  name: z
    .string()
    .transform((s) => (typeof s === "string" ? s.trim() : ""))
    .refine((s) => s.length > 0, "שם הלקוח נדרש"),
  contact_person: optionalString,
  email: optionalEmail,
  phone: optionalString,
  address: optionalString,
  identity_number: optionalString,
  client_type: z.enum(["casual", "regular"]).default("casual"),
  notes: optionalString,
});

export type ClientInput = z.infer<typeof clientSchema>;
