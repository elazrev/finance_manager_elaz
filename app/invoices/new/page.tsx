"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Client, Item } from "@/types";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client_id") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setValue,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      client_id: preselectedClientId || undefined,
      type: "invoice",
      payment_status: "pending",
      items: [
        { description: "", quantity: 1, unit_price: 0, discount: 0 },
      ],
    },
  });

  const paymentStatus = watch("payment_status");
  const isPaidFull = paymentStatus === "paid";

  useEffect(() => {
    if (preselectedClientId && clients.some((c) => c.id === preselectedClientId)) {
      setValue("client_id", preselectedClientId);
    }
  }, [preselectedClientId, clients, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const calculateItemTotal = (item: { quantity: number; unit_price: number; discount?: number }) => {
    const discountAmount = (item.discount || 0) / 100;
    return item.quantity * item.unit_price * (1 - discountAmount);
  };

  const { subtotal, total } = (() => {
    const s = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return {
      subtotal: Math.round(s * 100) / 100,
      total: Math.round(s * 100) / 100,
    };
  })();

  const createMutation = useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה ביצירת החשבונית");
      }
      return res.json();
    },
    onSuccess: () => router.push("/invoices"),
    onError: (err: Error) => {
      alert(err.message);
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CreateInvoiceInput) => {
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  const addItem = () => {
    append({ description: "", quantity: 1, unit_price: 0, discount: 0 });
  };

  const addFromCatalog = (item: Item) => {
    append({
      description: item.description ? `${item.name} - ${item.description}` : item.name,
      quantity: 1,
      unit_price: item.price,
      discount: 0,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">צור חשבונית חדשה</h1>
          <p className="text-base sm:text-lg text-muted-foreground">מלא את הפרטים ליצירת חשבונית</p>
        </div>
        <Link href="/invoices">
          <Button variant="outline" className="touch-manipulation min-h-[44px]">חזור לרשימה</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>פרטי חשבונית</CardTitle>
            <CardDescription>מידע כללי על החשבונית</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">לקוח (אופציונלי)</Label>
                <Select id="client_id" {...register("client_id")}>
                  <option value="">— ללא לקוח —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                </Select>
                {clients.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <Link href="/clients/new" className="text-primary hover:underline">הוסף לקוח</Link>
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="type">סוג</Label>
                <Select id="type" {...register("type")}>
                  <option value="invoice">חשבונית</option>
                  <option value="receipt">קבלה</option>
                  <option value="credit">חשבונית זיכוי</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_status">סטטוס תשלום</Label>
                <Select id="payment_status" {...register("payment_status")}>
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_method">
                  אמצעי תשלום {isPaidFull ? "(חובה כששולם במלואו – כנדרש בחוק)" : "(אופציונלי)"}
                </Label>
                <Select id="payment_method" {...register("payment_method")}>
                  <option value="">— לא נבחר —</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-destructive mt-1">{errors.payment_method.message}</p>
                )}
              </div>
              {isPaidFull && (
                <div>
                  <Label htmlFor="paid_at">תאריך תשלום (תאריך קבלת הכסף)</Label>
                  <Input id="paid_at" type="date" {...register("paid_at")} />
                </div>
              )}
              <div>
                <Label htmlFor="due_date">תאריך פירעון (אופציונלי)</Label>
                <Input id="due_date" type="date" {...register("due_date")} />
              </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor={`items.${index}.description`}>תיאור *</Label>
                    <Input
                      id={`items.${index}.description`}
                      placeholder="תיאור הפריט או השירות"
                      {...register(`items.${index}.description`)}
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`items.${index}.quantity`}>כמות *</Label>
                    <Input
                      id={`items.${index}.quantity`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`items.${index}.unit_price`}>מחיר יחידה (₪) *</Label>
                    <Input
                      id={`items.${index}.unit_price`}
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    />
                    {errors.items?.[index]?.unit_price && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.items[index]?.unit_price?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`items.${index}.discount`}>הנחה (%)</Label>
                    <Input
                      id={`items.${index}.discount`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`items.${index}.discount`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
                  <span className="text-sm text-muted-foreground">
                    סה"כ פריט: <span className="font-bold">{formatCurrency(calculateItemTotal(items[index]))}</span>
                  </span>
                  {fields.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0 w-fit" onClick={() => remove(index)}>
                      מחק פריט
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="touch-manipulation min-h-[44px]" onClick={addItem}>
                הוסף פריט
              </Button>
              {catalogItems.length > 0 && (
                <Select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) {
                      const it = catalogItems.find((i) => i.id === id);
                      if (it) addFromCatalog(it);
                      e.target.value = "";
                    }
                  }}
                  className="w-auto"
                >
                  <option value="">הוסף מהקטלוג...</option>
                  {catalogItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} - {formatCurrency(it.price)}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סיכום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">סה"כ לפני מע״מ:</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">מע״מ (עוסק פטור):</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold">
              <span>סה"כ לתשלום (כולל מע״מ):</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">עוסק פטור - המחיר פטור ממע״מ</p>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 justify-end">
          <Button type="button" variant="outline" className="touch-manipulation min-h-[44px]" onClick={() => router.back()} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button type="submit" className="touch-manipulation min-h-[44px]" disabled={isSubmitting}>
            {isSubmitting ? "שומר..." : "שמור חשבונית"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-4">טוען...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
