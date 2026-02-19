"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuoteSchema, type CreateQuoteInput } from "@/lib/validations/quote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Client, Item, Quote } from "@/types";

function mapQuoteToFormValues(quote: Quote & { clients?: { id?: string } }): CreateQuoteInput {
  const validUntil = quote.valid_until
    ? (quote.valid_until.includes("T") ? quote.valid_until.split("T")[0] : quote.valid_until)
    : undefined;
  return {
    client_id: quote.client_id ?? "",
    items:
      (quote.items ?? []).length > 0
        ? (quote.items ?? []).map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount ?? 0,
          }))
        : [{ description: "", quantity: 1, unit_price: 0, discount: 0 }],
    valid_until: validUntil,
    notes: quote.notes ?? "",
  };
}

export default function QuoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${id}`);
      if (!res.ok) throw new Error("הצעה לא נמצאה");
      const j = await res.json();
      return j.data as Quote & { clients?: { id?: string } };
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      const j = await res.json();
      return (j.data || []) as Client[];
    },
  });

  const { data: catalogItems = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const res = await fetch("/api/items");
      const j = await res.json();
      return (j.data || []) as Item[];
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      client_id: "",
      items: [{ description: "", quantity: 1, unit_price: 0, discount: 0 }],
      valid_until: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (quote) reset(mapQuoteToFormValues(quote));
  }, [quote, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const calculateItemTotal = (item: { quantity: number; unit_price: number; discount?: number }) => {
    const discountAmount = (item.discount || 0) / 100;
    return item.quantity * item.unit_price * (1 - discountAmount);
  };

  const total = (items ?? []).reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalRounded = Math.round(total * 100) / 100;

  const updateMutation = useMutation({
    mutationFn: async (data: CreateQuoteInput) => {
      const payload = {
        client_id: data.client_id || undefined,
        items: data.items,
        valid_until: data.valid_until || undefined,
        notes: data.notes || undefined,
      };
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בעדכון הצעה");
      }
      return res.json();
    },
    onSuccess: () => router.push(`/quotes/${id}`),
    onError: (err: Error) => {
      alert(err.message);
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CreateQuoteInput) => {
    setIsSubmitting(true);
    updateMutation.mutate(data);
  };

  const addItem = () => append({ description: "", quantity: 1, unit_price: 0, discount: 0 });

  const addFromCatalog = (item: Item) => {
    append({
      description: item.description ? `${item.name} - ${item.description}` : item.name,
      quantity: 1,
      unit_price: item.price,
      discount: 0,
    });
  };

  if (isLoading) return <div className="container mx-auto p-8">טוען...</div>;
  if (error || !quote) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive mb-4">הצעה לא נמצאה</p>
        <Link href="/quotes"><Button variant="outline">חזור לרשימה</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">עריכת הצעת מחיר {quote.quote_number}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">עדכון פרטי ההצעה</p>
        </div>
        <Link href={`/quotes/${id}`}>
          <Button variant="outline" className="touch-manipulation min-h-[44px]">חזור להצעה</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>פרטי הצעה</CardTitle>
            <CardDescription>מידע כללי על ההצעה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_id">לקוח (אופציונלי)</Label>
              <Select id="client_id" {...register("client_id")}>
                <option value="">— ללא לקוח —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="valid_until">תוקף עד (אופציונלי)</Label>
              <Input id="valid_until" type="date" {...register("valid_until")} />
            </div>
            <div>
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" placeholder="הערות נוספות..." {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>פריטים</CardTitle>
            <CardDescription>רשימת הפריטים והשירותים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>תיאור *</Label>
                    <Input placeholder="תיאור הפריט" {...register(`items.${index}.description`)} />
                    {errors.items?.[index]?.description && (
                      <p className="text-sm text-destructive">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>כמות *</Label>
                    <Input type="number" step="0.01" min="0.01" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label>מחיר יחידה (₪) *</Label>
                    <Input type="number" step="0.01" min="0" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label>הנחה (%)</Label>
                    <Input type="number" step="0.01" min="0" max="100" {...register(`items.${index}.discount`, { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    סה"כ פריט: <span className="font-bold">{formatCurrency(calculateItemTotal(items[index]))}</span>
                  </span>
                  {fields.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>מחק פריט</Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="touch-manipulation min-h-[44px]" onClick={addItem}>הוסף פריט</Button>
              {catalogItems.length > 0 && (
                <Select value="" onChange={(e) => {
                  const vid = e.target.value;
                  if (vid) {
                    const it = catalogItems.find((i) => i.id === vid);
                    if (it) addFromCatalog(it);
                    e.target.value = "";
                  }
                }} className="w-auto">
                  <option value="">הוסף מהקטלוג...</option>
                  {catalogItems.map((it) => (
                    <option key={it.id} value={it.id}>{it.name} - {formatCurrency(it.price)}</option>
                  ))}
                </Select>
              )}
            </div>
            {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>סיכום</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">סה"כ: {formatCurrency(totalRounded)}</p>
            <p className="text-xs text-muted-foreground mt-1">עוסק פטור - המחיר פטור ממע״מ</p>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 justify-end">
          <Link href={`/quotes/${id}`}>
            <Button type="button" variant="outline" className="touch-manipulation min-h-[44px]">ביטול</Button>
          </Link>
          <Button type="submit" className="touch-manipulation min-h-[44px]" disabled={isSubmitting}>
            {isSubmitting ? "שומר..." : "שמור עדכונים"}
          </Button>
        </div>
      </form>
    </div>
  );
}
