"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemSchema, type ItemInput } from "@/lib/validations/item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

const Optional = () => <span className="text-muted-foreground font-normal"> (אופציונלי)</span>;

export default function NewItemPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "ILS",
      is_active: true,
    },
  });

  const create = useMutation({
    mutationFn: async (data: ItemInput) => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה ביצירת הפריט");
      }
      return res.json();
    },
    onSuccess: () => {
      router.push("/items");
      router.refresh();
    },
  });

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">הוסף פריט חדש</h1>
        <Link href="/items">
          <Button variant="outline">חזור לרשימה</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הפריט</CardTitle>
          <CardDescription>
            הוסף פריט או שירות שיופיע בספרייה. ניתן לבחור פריט זה בעת יצירת חשבוניות והצעות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => create.mutate(data))} className="space-y-4">
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
            {create.isError && (
              <p className="text-sm text-destructive">{create.error.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "שומר..." : "שמור פריט"}
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
