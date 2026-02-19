"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientInput } from "@/lib/validations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { Client } from "@/types";

const Optional = () => <span className="text-muted-foreground font-normal"> (אופציונלי)</span>;

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error("לקוח לא נמצא");
      const j = await res.json();
      return j.data as Client;
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    values: client ? {
      name: client.name,
      contact_person: client.contact_person || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      identity_number: client.identity_number || "",
      client_type: client.client_type,
      notes: client.notes || "",
    } : undefined,
  });

  const update = useMutation({
    mutationFn: async (data: ClientInput) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בעדכון");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push(`/clients/${id}`);
      router.refresh();
    },
  });

  if (isLoading || !client) return <div className="container mx-auto p-8">טוען...</div>;

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">עריכת לקוח</h1>
        <Link href={`/clients/${id}`}>
          <Button variant="outline">ביטול</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטי הלקוח</CardTitle>
          <CardDescription>עדכן את הפרטים ושמור. רק השם חובה.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="name">שם / שם העסק *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="contact_person">איש קשר<Optional /></Label>
              <Input id="contact_person" {...register("contact_person")} />
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
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">טלפון<Optional /></Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div>
              <Label htmlFor="address">כתובת<Optional /></Label>
              <Input id="address" {...register("address")} />
            </div>
            <div>
              <Label htmlFor="identity_number">ת.ז. / ח.פ.<Optional /></Label>
              <Input id="identity_number" {...register("identity_number")} />
            </div>
            <div>
              <Label htmlFor="notes">הערות<Optional /></Label>
              <Textarea id="notes" {...register("notes")} />
            </div>
            {update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "שומר..." : "שמור שינויים"}
              </Button>
              <Link href={`/clients/${id}`}>
                <Button type="button" variant="outline">ביטול</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
