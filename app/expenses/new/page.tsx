"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, EXPENSE_CATEGORIES, type ExpenseInput } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

const Optional = () => <span className="text-muted-foreground font-normal"> (אופציונלי)</span>;

const today = new Date().toISOString().slice(0, 10);

export default function NewExpensePage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      date: today,
      category: "other",
      vat_included: true,
    },
  });

  const create = useMutation({
    mutationFn: async (data: ExpenseInput) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה ביצירת ההוצאה");
      }
      return res.json();
    },
    onSuccess: () => {
      router.push("/expenses");
      router.refresh();
    },
  });

  return (
    <div className="container mx-auto max-w-2xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold">הוסף הוצאה</h1>
        <Link href="/expenses">
          <Button variant="outline" className="touch-manipulation min-h-[44px]">
            חזור לרשימה
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי ההוצאה</CardTitle>
          <CardDescription>
            הוצאה מוכרת לצורך מס הכנסה – שמור מסמכים תומכים (קבלות, חשבוניות) למשך 7 שנים.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => create.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">סכום (₪) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("amount")}
                  placeholder="0"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="date">תאריך ההוצאה *</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category">קטגוריה *</Label>
              <Select {...register("category")} id="category">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">ספק / קבלן<Optional /></Label>
              <Input
                id="supplier"
                {...register("supplier")}
                placeholder="שם הספק או הקבלן"
              />
            </div>

            <div>
              <Label htmlFor="description">תיאור ההוצאה<Optional /></Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="תיאור קצר"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="receipt_reference">מספר חשבונית / קבלה<Optional /></Label>
              <Input
                id="receipt_reference"
                {...register("receipt_reference")}
                placeholder="למשל: חשבונית מס 12345"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("vat_included")} className="rounded" />
                <span className="text-sm">הסכום כולל מע״מ</span>
              </label>
            </div>

            <div>
              <Label htmlFor="notes">הערות<Optional /></Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="הערות נוספות"
                rows={2}
              />
            </div>

            {create.isError && (
              <p className="text-sm text-destructive">{create.error.message}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "שומר..." : "שמור הוצאה"}
              </Button>
              <Link href="/expenses">
                <Button type="button" variant="outline">
                  ביטול
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
