"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

const Optional = () => <span className="text-muted-foreground font-normal"> (אופציונלי)</span>;

export default function NewClientPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_type: "casual",
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      identity_number: "",
      notes: "",
    },
  });

  const create = useMutation({
    mutationFn: async (data: ClientInput) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה ביצירת הלקוח");
      }
      return res.json();
    },
    onSuccess: () => {
      router.push("/clients");
      router.refresh();
    },
  });

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">הוסף לקוח חדש</h1>
        <Link href="/clients">
          <Button variant="outline">חזור לרשימה</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הלקוח</CardTitle>
          <CardDescription>
            מלא את השדות הרלוונטיים. רק השם חובה – שאר השדות אופציונליים.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => create.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="name">שם / שם העסק *</Label>
              <Input id="name" {...register("name")} placeholder="שם מלא או שם העסק" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contact_person">איש קשר<Optional /></Label>
              <Input id="contact_person" {...register("contact_person")} placeholder="איש קשר בחברה" />
            </div>
            <div>
              <Label htmlFor="client_type">סוג לקוח</Label>
              <Select id="client_type" {...register("client_type")}>
                <option value="casual">מזדמן</option>
                <option value="regular">קבוע</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">אימייל<Optional /></Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">טלפון<Optional /></Label>
              <Input id="phone" {...register("phone")} placeholder="050-0000000" />
            </div>
            <div>
              <Label htmlFor="address">כתובת<Optional /></Label>
              <Input id="address" {...register("address")} placeholder="כתובת מלאה" />
            </div>
            <div>
              <Label htmlFor="identity_number">ת.ז. / ח.פ.<Optional /></Label>
              <Input id="identity_number" {...register("identity_number")} placeholder="מספר זהות או ח.פ." />
            </div>
            <div>
              <Label htmlFor="notes">הערות<Optional /></Label>
              <Textarea id="notes" {...register("notes")} placeholder="הערות פנימיות" />
            </div>
            {create.isError && (
              <p className="text-sm text-destructive">{create.error.message}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "שומר..." : "שמור לקוח"}
              </Button>
              <Link href="/clients">
                <Button type="button" variant="outline">ביטול</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
