"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemSchema, type ItemInput } from "@/lib/validations/item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Item } from "@/types";

const Optional = () => <span className="text-muted-foreground font-normal"> (אופציונלי)</span>;

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ["items", id],
    queryFn: async () => {
      const res = await fetch(`/api/items/${id}`);
      if (!res.ok) throw new Error("פריט לא נמצא");
      const j = await res.json();
      return j.data as Item;
    },
    enabled: !!id,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "ILS",
      is_active: true,
    },
  });

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (item && !hasInitialized.current) {
      reset({
        name: item.name,
        description: item.description ?? "",
        price: item.price,
        currency: item.currency ?? "ILS",
        is_active: item.is_active ?? true,
      });
      hasInitialized.current = true;
    }
  }, [item, reset]);

  const update = useMutation({
    mutationFn: async (data: ItemInput) => {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בעדכון הפריט");
      }
      return res.json();
    },
    onSuccess: () => {
      router.push("/items");
      router.refresh();
    },
  });

  if (isLoading || (!item && !isError)) {
    return (
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">עריכת פריט</h1>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">עריכת פריט</h1>
          <p className="text-muted-foreground mb-4">פריט לא נמצא</p>
          <Link href="/items">
            <Button variant="outline">חזור לרשימה</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">עריכת פריט</h1>
        <Link href="/items">
          <Button variant="outline">חזור לרשימה</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הפריט</CardTitle>
          <CardDescription>
            עדכן את פרטי הפריט או השירות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="name">שם הפריט / השירות *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="למשל: תקלוט אירוע, יעוץ שעתי"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">תיאור<Optional /></Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="תיאור קצר של הפריט"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="price">מחיר (₪) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price")}
                placeholder="0"
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("is_active")} className="rounded" />
                <span className="text-sm">פריט פעיל (מופיע בבחירה)</span>
              </label>
            </div>
            {update.isError && (
              <p className="text-sm text-destructive">{update.error.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "שומר..." : "שמור שינויים"}
              </Button>
              <Link href="/items">
                <Button type="button" variant="outline">ביטול</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
