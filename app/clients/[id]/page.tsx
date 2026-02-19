"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CLIENT_TYPES, PAYMENT_STATUSES, QUOTE_STATUSES } from "@/lib/constants";
import type { Client } from "@/types";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: client, isLoading, error } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error("לקוח לא נמצא");
      const j = await res.json();
      return j.data as Client;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["client-transactions", id],
    queryFn: async () => {
      const [invRes, quoRes] = await Promise.all([
        fetch(`/api/invoices?client_id=${id}`),
        fetch(`/api/quotes?client_id=${id}`),
      ]);
      const invJ = await invRes.json();
      const quoJ = await quoRes.json();
      return {
        invoices: (invJ.data || []) as Array<{ id: string; invoice_number: string; total: number; type?: string; payment_status?: string; created_at: string; paid_at?: string }>,
        quotes: (quoJ.data || []) as Array<{ id: string; quote_number: string; total: number; status: string; created_at: string }>,
      };
    },
    enabled: !!client,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("שגיאה במחיקה");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/clients");
      router.refresh();
    },
  });

  const getTypeLabel = (t: string) => CLIENT_TYPES.find((c) => c.value === t)?.label || t;

  if (isLoading) return <div className="container mx-auto p-8">טוען...</div>;
  if (error || !client) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive mb-4">לקוח לא נמצא</p>
        <Link href="/clients"><Button variant="outline">חזור לרשימה</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold break-words">{client.name}</h1>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href={`/clients/${id}/edit`}>
            <Button variant="outline">ערוך</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => window.confirm("למחוק את הלקוח?") && deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            מחק
          </Button>
          <Link href="/clients">
            <Button variant="ghost">חזור לרשימה</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">פרטי קשר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm sm:text-base break-words">
            {client.contact_person && (
              <p><span className="text-muted-foreground">איש קשר:</span> {client.contact_person}</p>
            )}
            <p><span className="text-muted-foreground">אימייל:</span> {client.email || "—"}</p>
            <p><span className="text-muted-foreground">טלפון:</span> {client.phone || "—"}</p>
            <p><span className="text-muted-foreground">כתובת:</span> {client.address || "—"}</p>
            <p><span className="text-muted-foreground">ת.ז./ח.פ.:</span> {client.identity_number || "—"}</p>
            <p><span className="text-muted-foreground">סוג:</span> {getTypeLabel(client.client_type)}</p>
            <p><span className="text-muted-foreground">נוסף ב:</span> {formatDate(client.created_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>הערות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{client.notes || "אין הערות"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 sm:mt-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">פעולות מהירות</CardTitle>
          <CardDescription>צור הצעת מחיר או חשבונית ללקוח זה</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 sm:gap-4">
          <Link href={`/quotes/new?client_id=${id}`}>
            <Button variant="outline" className="touch-manipulation min-h-[44px]">צור הצעת מחיר</Button>
          </Link>
          <Link href={`/invoices/new?client_id=${id}`}>
            <Button className="touch-manipulation min-h-[44px]">צור חשבונית</Button>
          </Link>
          <Link href={`/reports/print?type=clients&client_id=${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="touch-manipulation min-h-[44px]">הדפס דוח לקוח</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="mt-4 sm:mt-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">עסקאות</CardTitle>
          <CardDescription>חשבוניות והצעות מחיר של הלקוח</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">חשבוניות</h3>
            <div className="md:hidden space-y-3">
              {(transactions?.invoices || []).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">{inv.invoice_number}</span>
                    <span className="font-bold">{inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)} · {PAYMENT_STATUSES.find((s) => s.value === inv.payment_status)?.label ?? inv.payment_status}</p>
                  <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                </Link>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">מס'</th>
                    <th className="p-2">תאריך</th>
                    <th className="p-2">תאריך תשלום</th>
                    <th className="p-2">סטטוס</th>
                    <th className="p-2">סכום</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(transactions?.invoices || []).map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-2 font-medium">{inv.invoice_number}</td>
                      <td className="p-2">{formatDate(inv.created_at)}</td>
                      <td className="p-2">{inv.paid_at ? formatDate(inv.paid_at) : "—"}</td>
                      <td className="p-2">{PAYMENT_STATUSES.find((s) => s.value === inv.payment_status)?.label ?? inv.payment_status}</td>
                      <td className="p-2 font-bold">{inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}</td>
                      <td className="p-2">
                        <Link href={`/invoices/${inv.id}`}>
                          <Button variant="ghost" size="sm">צפה</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(transactions?.invoices?.length ?? 0) === 0 && (
              <p className="text-muted-foreground py-4 text-center">אין חשבוניות</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">הצעות מחיר</h3>
            <div className="md:hidden space-y-3">
              {(transactions?.quotes || []).map((q) => (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">{q.quote_number}</span>
                    <span className="font-bold">{formatCurrency(q.total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(q.created_at)} · {QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}</p>
                  <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                </Link>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">מס' הצעה</th>
                    <th className="p-2">תאריך</th>
                    <th className="p-2">סטטוס</th>
                    <th className="p-2">סכום</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(transactions?.quotes || []).map((q) => (
                    <tr key={q.id} className="border-b">
                      <td className="p-2 font-medium">{q.quote_number}</td>
                      <td className="p-2">{formatDate(q.created_at)}</td>
                      <td className="p-2">{QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}</td>
                      <td className="p-2 font-bold">{formatCurrency(q.total)}</td>
                      <td className="p-2">
                        <Link href={`/quotes/${q.id}`}>
                          <Button variant="ghost" size="sm">צפה</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(transactions?.quotes?.length ?? 0) === 0 && (
              <p className="text-muted-foreground py-4 text-center">אין הצעות מחיר</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
