"use client";

import { Suspense, useState, useEffect } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Client, Item } from "@/types";

function NewQuoteContent() {
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
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      client_name: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          discount: 0,
        },
      ],
    },
  });

  useEffect(() => {
    if (preselectedClientId && clients.some((c) => c.id === preselectedClientId)) {
      const c = clients.find((x) => x.id === preselectedClientId);
      if (c) setValue("client_name", c.name);
    }
  }, [preselectedClientId, clients, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  const calculateItemTotal = (item: any) => {
    const discountAmount = (item.discount || 0) / 100;
    return item.quantity * item.unit_price * (1 - discountAmount);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0
    );
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(subtotal * 100) / 100,
    };
  };

  const { subtotal, total } = calculateTotals();

  const createQuoteMutation = useMutation({
    mutationFn: async (data: CreateQuoteInput) => {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "שגיאה ביצירת הצעה");
      }

      return response.json();
    },
    onSuccess: () => {
      router.push("/quotes");
    },
    onError: (error: Error) => {
      alert(error.message);
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CreateQuoteInput) => {
    setIsSubmitting(true);
    createQuoteMutation.mutate(data);
  };

  const addItem = () => {
    append({
      description: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
    });
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">צור הצעת מחיר חדשה</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          מלא את הפרטים ליצירת הצעת מחיר חדשה
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>פרטי הצעה</CardTitle>
            <CardDescription>מידע כללי על ההצעה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_name">לקוח (אופציונלי)</Label>
              <Input
                id="client_name"
                {...register("client_name")}
                list="client-suggestions"
                placeholder="הקלד שם לקוח – שם חדש יהפוך ללקוח זמני"
              />
              <datalist id="client-suggestions">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground mt-1">
                הקלד שם קיים או שם חדש. שם שלא קיים במערכת יהפוך אוטומטית ללקוח זמני.
              </p>
              {errors.client_name && (
                <p className="text-sm text-destructive mt-1">{errors.client_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="valid_until">תוקף עד (אופציונלי)</Label>
              <Input
                id="valid_until"
                type="date"
                {...register("valid_until")}
              />
            </div>

            <div>
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                placeholder="הערות נוספות..."
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>פריטים</CardTitle>
            <CardDescription>רשימת הפריטים והשירותים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor={`items.${index}.description`}>
                        תיאור *
                      </Label>
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
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`items.${index}.unit_price`}>
                        מחיר יחידה (₪) *
                      </Label>
                      <Input
                        id={`items.${index}.unit_price`}
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unit_price`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.unit_price && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.items[index]?.unit_price?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`items.${index}.discount`}>
                        הנחה (%)
                      </Label>
                      <Input
                        id={`items.${index}.discount`}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        defaultValue={0}
                        {...register(`items.${index}.discount`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor={`items.${index}.notes`}>הערות</Label>
                      <Input
                        id={`items.${index}.notes`}
                        placeholder="הערות על הפריט"
                        {...register(`items.${index}.notes`)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-2">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        סה"כ פריט:{" "}
                      </span>
                      <span className="font-bold">
                        {formatCurrency(calculateItemTotal(items[index]))}
                      </span>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="touch-manipulation min-h-[44px] sm:min-h-0 w-fit"
                        onClick={() => remove(index)}
                      >
                        מחק פריט
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={addItem}>
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

            {errors.items && (
              <p className="text-sm text-destructive">
                {errors.items.message}
              </p>
            )}
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
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>סה"כ לתשלום (כולל מע״מ):</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">עוסק פטור - המחיר פטור ממע״מ</p>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            className="touch-manipulation min-h-[44px]"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button type="submit" className="touch-manipulation min-h-[44px]" disabled={isSubmitting}>
            {isSubmitting ? "שומר..." : "שמור כטיוטא"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="p-4">טוען...</div>}>
      <NewQuoteContent />
    </Suspense>
  );
}
