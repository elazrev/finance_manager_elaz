"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPaymentRequestSchema, type CreatePaymentRequestInput } from "@/lib/validations/payment-request";
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
import type { Client, Item, PaymentRequest } from "@/types";

function mapPaymentRequestToFormValues(pr: PaymentRequest): CreatePaymentRequestInput {
  const dueDate = pr.due_date
    ? (pr.due_date.includes("T") ? pr.due_date.split("T")[0] : pr.due_date)
    : undefined;
  return {
    client_id: pr.client_id ?? "",
    due_date: dueDate,
    notes: pr.notes ?? "",
    items:
      (pr.items ?? []).length > 0
        ? (pr.items ?? []).map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount ?? 0,
          }))
        : [{ description: "", quantity: 1, unit_price: 0, discount: 0 }],
  };
}

export default function PaymentRequestEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: pr, isLoading, error } = useQuery({
    queryKey: ["payment-request", id],
    queryFn: async () => {
      const res = await fetch(`/api/payment-requests/${id}`);
      if (!res.ok) throw new Error("דרישת תשלום לא נמצאה");
      const j = await res.json();
      return j.data as PaymentRequest;
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
  } = useForm<CreatePaymentRequestInput>({
    resolver: zodResolver(createPaymentRequestSchema),
    defaultValues: {
      client_id: "",
      items: [{ description: "", quantity: 1, unit_price: 0, discount: 0 }],
      due_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (pr) reset(mapPaymentRequestToFormValues(pr));
  }, [pr, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const calculateItemTotal = (item: { quantity: number; unit_price: number; discount?: number }) => {
    const discountAmount = (item.discount || 0) / 100;
    return item.quantity * item.unit_price * (1 - discountAmount);
  };

  const total = (items ?? []).reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalRounded = Math.round(total * 100) / 100;

  const updateMutation = useMutation({
    mutationFn: async (data: CreatePaymentRequestInput) => {
      const res = await fetch(`/api/payment-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בעדכון דרישת התשלום");
      }
      return res.json();
    },
    onSuccess: () => router.push(`/payment-requests/${id}`),
  });

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
  if (error || !pr) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive mb-4">דרישת תשלום לא נמצאה</p>
        <Link href="/payment-requests"><Button variant="outline">חזור לרשימה</Button></Link>
      </div>
    );
  }

  if (pr.status === "converted") {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive mb-4">לא ניתן לערוך דרישת תשלום שכבר הומרה לחשבונית</p>
        <Link href={`/payment-requests/${id}`}><Button variant="outline">חזור לדרישה</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">עריכת דרישת תשלום {pr.request_number}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">עדכון פרטי הדרישה</p>
        </div>
        <Link href={`/payment-requests/${id}`}>
          <Button variant="outline" className="touch-manipulation min-h-[44px]">חזור לדרישה</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>פרטי דרישה</CardTitle>
            <CardDescription>מידע על דרישת התשלום</CardDescription>
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
              <Label htmlFor="due_date">תאריך פירעון (אופציונלי)</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
            <div>
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" placeholder="הערות..." {...register("notes")} />
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
                  <span className="text-sm text-muted-foreground">
                    סה"כ: <span className="font-bold">{formatCurrency(calculateItemTotal(items[index]))}</span>
                  </span>
                  {fields.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0 w-fit" onClick={() => remove(index)}>מחק</Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>סיכום</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">סה"כ: {formatCurrency(totalRounded)}</p>
          </CardContent>
        </Card>

        {updateMutation.isError && (
          <p className="text-sm text-destructive">{updateMutation.error.message}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 justify-end">
          <Link href={`/payment-requests/${id}`}>
            <Button type="button" variant="outline" className="touch-manipulation min-h-[44px]">ביטול</Button>
          </Link>
          <Button type="submit" className="touch-manipulation min-h-[44px]" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "שומר..." : "שמור עדכונים"}
          </Button>
        </div>
      </form>
    </div>
  );
}
