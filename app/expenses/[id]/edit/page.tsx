"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, EXPENSE_CATEGORIES, type ExpenseInput } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";

const Optional = () => <span className="text-muted-foreground font-normal"> (אופציונלי)</span>;

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) throw new Error("הוצאה לא נמצאה");
      const json = await res.json();
      return json.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
  });

  useEffect(() => {
    if (expense) {
      reset({
        amount: Number(expense.amount) || 0,
        date: expense.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        category: expense.category || "other",
        supplier: expense.supplier ?? "",
        description: expense.description ?? "",
        receipt_reference: expense.receipt_reference ?? "",
        vat_included: expense.vat_included ?? true,
        notes: expense.notes ?? "",
      });
    }
  }, [expense, reset]);

  const update = useMutation({
    mutationFn: async (data: ExpenseInput) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בעדכון ההוצאה");
      }
      return res.json();
    },
    onSuccess: () => {
      router.push("/expenses");
      router.refresh();
    },
  });

  if (isLoading || !expense) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <p className="text-center text-muted-foreground">טוען...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold">עריכת הוצאה</h1>
        <Link href="/expenses">
          <Button variant="outline" className="touch-manipulation min-h-[44px]">
            חזור לרשימה
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי ההוצאה</CardTitle>
          <CardDescription>עדכון פרטי ההוצאה</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => update.mutate(data))}
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
              <Input id="supplier" {...register("supplier")} />
            </div>

            <div>
              <Label htmlFor="description">תיאור ההוצאה<Optional /></Label>
              <Textarea id="description" {...register("description")} rows={2} />
            </div>

            <div>
              <Label htmlFor="receipt_reference">מספר חשבונית / קבלה<Optional /></Label>
              <Input id="receipt_reference" {...register("receipt_reference")} />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("vat_included")} className="rounded" />
                <span className="text-sm">הסכום כולל מע״מ</span>
              </label>
            </div>

            <div>
              <Label htmlFor="notes">הערות<Optional /></Label>
              <Textarea id="notes" {...register("notes")} rows={2} />
            </div>

            {update.isError && (
              <p className="text-sm text-destructive">{update.error.message}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "שומר..." : "שמור שינויים"}
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
