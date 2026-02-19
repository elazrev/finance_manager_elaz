"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import type { Invoice, InvoiceItem, UserSettings } from "@/types";

function CreateCreditButton({ invoiceId, onSuccess }: { invoiceId: string; onSuccess?: () => void }) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/create-credit`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה ביצירת חשבונית ביטול");
      }
      return res.json();
    },
    onSuccess: (data) => {
      onSuccess?.();
      if (data?.data?.id) router.push(`/invoices/${data.data.id}`);
    },
  });
  return (
    <Button
      variant="outline"
      size="sm"
      className="touch-manipulation min-h-[44px] sm:min-h-0"
      onClick={() => window.confirm("ליצור חשבונית ביטול (זיכוי) עבור חשבונית זו? הערך יופיע כשלילי בדוחות ההכנסות.") && mutation.mutate()}
      disabled={mutation.isPending}
      title="חשבונית ביטול – ערך שלילי בדוחות"
    >
      {mutation.isPending ? "יוצר..." : "צור חשבונית ביטול"}
    </Button>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("חשבונית לא נמצאה");
      const j = await res.json();
      return j.data as Invoice & { clients?: { name?: string; email?: string; phone?: string; address?: string } };
    },
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) return null;
      const j = await res.json();
      return j.data;
    },
  });

  const [emailError, setEmailError] = useState<string | null>(null);
  const showEditDate = (user?.settings as UserSettings)?.show_edit_date_on_documents ?? true;
  const wasEdited = invoice && invoice.updated_at && invoice.created_at && new Date(invoice.updated_at).getTime() - new Date(invoice.created_at).getTime() > 2000;

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}/send-email`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "שגיאה בשליחה");
    },
    onSuccess: () => {
      setEmailError(null);
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
    },
    onError: (err: Error) => setEmailError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה במחיקה");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      window.location.href = "/invoices";
    },
  });

  const getStatusLabel = (s: string) => PAYMENT_STATUSES.find((x) => x.value === s)?.label || s;
  const getMethodLabel = (m: string) => PAYMENT_METHODS.find((x) => x.value === m)?.label || m;

  if (isLoading) return <div className="container mx-auto p-8">טוען...</div>;
  if (error || !invoice) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive mb-4">חשבונית לא נמצאה</p>
        <Link href="/invoices"><Button variant="outline">חזור לרשימה</Button></Link>
      </div>
    );
  }

  const items = (invoice.items || []) as InvoiceItem[];
  const client = invoice.clients;
  const canDelete = !["paid", "partially_paid"].includes(invoice.payment_status ?? "");

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-bold truncate">{invoice.invoice_number}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {invoice.type === "invoice" ? "חשבונית" : invoice.type === "receipt" ? "קבלה" : "חשבונית זיכוי"} • נוצר {formatDate(invoice.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {invoice.payment_status !== "paid" && invoice.type !== "credit" && (
            <Link href={`/invoices/${id}/edit`}>
              <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">ערוך</Button>
            </Link>
          )}
          {invoice.payment_status === "paid" && invoice.type !== "credit" && (
            <CreateCreditButton invoiceId={id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["invoice", id] })} />
          )}
          <Link href={`/invoices/${id}/print`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">הדפס / PDF</Button>
          </Link>
          {client?.email ? (
            <Button
              variant="outline"
              size="sm"
              className="touch-manipulation min-h-[44px] sm:min-h-0"
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? "שולח..." : "שלח אימייל"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0" disabled title="ללקוח אין אימייל">
              שלח אימייל
            </Button>
          )}
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              className="touch-manipulation min-h-[44px] sm:min-h-0"
              onClick={() => window.confirm("למחוק את החשבונית?") && deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              מחק
            </Button>
          ) : (
            <Button variant="destructive" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0" disabled title="חשבונית ששולמה אינה ניתנת למחיקה – נכנסת למחזור הכספים">
              מחק
            </Button>
          )}
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">חזור</Button>
          </Link>
        </div>
      </div>
      {(emailError || deleteMutation.isError) && (
        <p className="text-sm text-destructive mt-2 mb-4">{emailError || deleteMutation.error?.message}</p>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>פרטי לקוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client ? (
              <>
                <p><span className="text-muted-foreground">שם:</span> {client.name}</p>
                {client.email && <p><span className="text-muted-foreground">אימייל:</span> {client.email}</p>}
                {client.phone && <p><span className="text-muted-foreground">טלפון:</span> {client.phone}</p>}
                {client.address && <p><span className="text-muted-foreground">כתובת:</span> {client.address}</p>}
              </>
            ) : (
              <p className="text-muted-foreground">ללא לקוח</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>פרטי תשלום</CardTitle>
            {invoice.payment_status === "paid" && invoice.type !== "credit" && (
              <div className="mt-2 flex flex-col gap-1 rounded-lg bg-green-500/15 px-4 py-3 text-green-700 dark:text-green-400">
                <span className="text-lg font-bold">✓ שולם</span>
                {invoice.payment_method && (
                  <span className="text-sm">אמצעי תשלום: {getMethodLabel(invoice.payment_method)}</span>
                )}
                {invoice.due_date && (
                  <span className="text-sm">תאריך פירעון: {formatDate(invoice.due_date)}</span>
                )}
                {invoice.paid_at && (
                  <span className="text-sm">תאריך תשלום: {formatDate(invoice.paid_at)}</span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="text-muted-foreground">סטטוס:</span> {getStatusLabel(invoice.payment_status)}</p>
            {invoice.payment_method && (
              <p><span className="text-muted-foreground">אמצעי תשלום:</span> {getMethodLabel(invoice.payment_method)}</p>
            )}
            {invoice.due_date && (
              <p><span className="text-muted-foreground">תאריך פירעון:</span> {formatDate(invoice.due_date)}</p>
            )}
            {invoice.paid_at && (
              <p><span className="text-muted-foreground">תאריך תשלום:</span> {formatDate(invoice.paid_at)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>פריטים</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: card layout for items */}
          <div className="md:hidden space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg border bg-muted/30">
                <p className="font-medium mb-2">{item.description}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>כמות: {item.quantity}</span>
                  <span>מחיר: {formatCurrency(item.unit_price)}</span>
                  <span>הנחה: {item.discount ?? 0}%</span>
                  <span className="font-semibold text-foreground">סה"כ: {formatCurrency(item.total ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-right">
                  <th className="p-2">תיאור</th>
                  <th className="p-2">כמות</th>
                  <th className="p-2">מחיר יחידה</th>
                  <th className="p-2">הנחה %</th>
                  <th className="p-2">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{formatCurrency(item.unit_price)}</td>
                    <td className="p-2">{item.discount ?? 0}%</td>
                    <td className="p-2 font-medium">{formatCurrency(item.total ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 sm:mt-6 flex justify-end">
            <div className="text-left w-full sm:min-w-[220px] sm:w-auto space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">סה"כ לפני מע״מ:</span>
                <span className="font-medium">{formatCurrency(invoice.total ?? 0)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">מע״מ (עוסק פטור):</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between gap-4 pt-2 border-t">
                <span className="font-semibold">סה"כ לתשלום (כולל מע״מ):</span>
                <span className="text-xl sm:text-2xl font-bold">{formatCurrency(invoice.total ?? 0)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">עוסק פטור - המחיר פטור ממע״מ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(invoice.notes || (showEditDate && wasEdited)) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>הערות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoice.notes && <p className="whitespace-pre-wrap">{invoice.notes}</p>}
            {showEditDate && wasEdited && (
              <p className="text-xs text-muted-foreground">נערך לאחרונה: {formatDate(invoice.updated_at)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>פעולות</CardTitle>
          <CardDescription>קישורים מהירים</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 sm:gap-4">
          <Link href="/invoices/new">
            <Button variant="outline" className="touch-manipulation min-h-[44px]">צור חשבונית חדשה</Button>
          </Link>
          {client && (
            <Link href={`/quotes/new?client_id=${invoice.client_id}`}>
              <Button variant="outline" className="touch-manipulation min-h-[44px]">הצעת מחיר ללקוח זה</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
