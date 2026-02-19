import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  { value: "office_equipment", label: "ציוד משרדי" },
  { value: "office_rent", label: "שכירות משרד" },
  { value: "bookkeeping", label: "הנהלת חשבונות" },
  { value: "professional_development", label: "השתלמויות מקצועיות" },
  { value: "insurance", label: "ביטוח" },
  { value: "phone_internet", label: "טלפון ואינטרנט" },
  { value: "travel", label: "נסיעות" },
  { value: "marketing", label: "פרסום ושיווק" },
  { value: "supplies", label: "חומרי גלם/אספקה" },
  { value: "home_office", label: "משרד ביתי (חלקי)" },
  { value: "other", label: "אחר" },
] as const;

const categoryValues = EXPENSE_CATEGORIES.map((c) => c.value);

const optionalString = z
  .string()
  .optional()
  .transform((s) => (s == null || s === "" ? undefined : String(s).trim() || undefined));

export const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "סכום חייב להיות גדול מ-0"),
  date: z.string().refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), "תאריך לא תקין"),
  category: z.enum(categoryValues as [string, ...string[]], {
    errorMap: () => ({ message: "יש לבחור קטגוריה" }),
  }),
  supplier: optionalString,
  description: optionalString,
  receipt_reference: optionalString,
  attachment_url: optionalString,
  vat_included: z.boolean().default(true),
  notes: optionalString,
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
