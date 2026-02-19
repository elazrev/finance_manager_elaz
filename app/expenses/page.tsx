"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";
import type { Expense } from "@/types";

const getCategoryLabel = (value: string) =>
  EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", year, month, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("year", year);
      if (month) params.set("month", month);
      if (category) params.set("category", category);
      const res = await fetch(`/api/expenses?${params}`);
      const json = await res.json();
      return (json.data || []) as Expense[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה במחיקה");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const totalAmount = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const months = [
    { value: "", label: "כל החודשים" },
    { value: "1", label: "ינואר" },
    { value: "2", label: "פברואר" },
    { value: "3", label: "מרץ" },
    { value: "4", label: "אפריל" },
    { value: "5", label: "מאי" },
    { value: "6", label: "יוני" },
    { value: "7", label: "יולי" },
    { value: "8", label: "אוגוסט" },
    { value: "9", label: "ספטמבר" },
    { value: "10", label: "אוקטובר" },
    { value: "11", label: "נובמבר" },
    { value: "12", label: "דצמבר" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">הוצאות</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            ניהול הוצאות עסקיות – הוצאות מוכרות לצורך מס הכנסה
          </p>
        </div>
        <Link href="/expenses/new">
          <Button className="touch-manipulation min-h-[44px]">+ הוסף הוצאה</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>רשימת הוצאות</CardTitle>
          <CardDescription>
            {expenses.length} הוצאות
            {month ? ` | חודש ${months.find((m) => m.value === month)?.label}` : ""}
            {category ? ` | ${getCategoryLabel(category)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-28">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-36">
              {months.map((m) => (
                <option key={m.value || "all"} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
              <option value="">כל הקטגוריות</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">לא נרשמו הוצאות בתקופה זו</p>
              <Link href="/expenses/new">
                <Button variant="outline">הוסף הוצאה ראשונה</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full hidden sm:table">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">תאריך</th>
                      <th className="p-2">קטגוריה</th>
                      <th className="p-2">ספק / תיאור</th>
                      <th className="p-2">סכום</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{formatDate(e.date)}</td>
                        <td className="p-2">{getCategoryLabel(e.category)}</td>
                        <td className="p-2 text-muted-foreground max-w-[200px] truncate">
                          {e.supplier || e.description || "—"}
                        </td>
                        <td className="p-2 font-bold">{formatCurrency(e.amount)}</td>
                        <td className="p-2 flex gap-1 justify-end">
                          <Link href={`/expenses/${e.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              ערוך
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (window.confirm("למחוק את ההוצאה?")) {
                                deleteMutation.mutate(e.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            מחק
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile: card layout */}
                <div className="sm:hidden space-y-3">
                  {expenses.map((e) => (
                    <div
                      key={e.id}
                      className="p-4 rounded-lg border flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold">{formatCurrency(e.amount)}</span>
                        <div className="flex gap-2">
                          <Link href={`/expenses/${e.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              ערוך
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              if (window.confirm("למחוק?")) {
                                deleteMutation.mutate(e.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            מחק
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(e.date)} · {getCategoryLabel(e.category)}
                      </p>
                      {(e.supplier || e.description) && (
                        <p className="text-sm truncate">
                          {e.supplier || e.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-4 text-left font-bold text-lg">
                סה״כ: {formatCurrency(totalAmount)}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
