"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PAYMENT_REQUEST_STATUSES } from "@/lib/constants";
import type { PaymentRequest, InvoiceItem, UserSettings } from "@/types";

export default function PaymentRequestDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: pr, isLoading, error } = useQuery({
    queryKey: ["payment-request", id],
    queryFn: async () => {
      const res = await fetch(`/api/payment-requests/${id}`);
      if (!res.ok) throw new Error("דרישת תשלום לא נמצאה");
      const j = await res.json();
      return j.data as PaymentRequest & {
        clients?: { name?: string; email?: string; phone?: string; address?: string };
        converted_invoice_id?: string;
      };
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

  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payment-requests/${id}/convert`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בהמרה");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["payment-request", id] });
      if (data?.data?.invoice?.id) {
        window.location.href = `/invoices/${data.data.invoice.id}`;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payment-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("שגיאה במחיקה");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      window.location.href = "/payment-requests";
    },
  });

  const getStatusLabel = (s: string) =>
    PAYMENT_REQUEST_STATUSES.find((x) => x.value === s)?.label || s;

  const showEditDate = (user?.settings as UserSettings)?.show_edit_date_on_documents ?? true;
  const wasEdited = pr && pr.updated_at && pr.created_at && new Date(pr.updated_at).getTime() - new Date(pr.created_at).getTime() > 2000;

  if (isLoading) return <div className="container mx-auto p-8">טוען...</div>;
  if (error || !pr) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-destructive mb-4">דרישת תשלום לא נמצאה</p>
        <Link href="/payment-requests"><Button variant="outline">חזור לרשימה</Button></Link>
      </div>
    );
  }

  const items = (pr.items || []) as InvoiceItem[];
  const client = pr.clients;
  const canConvert = pr.status !== "converted" && pr.status !== "cancelled";

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-bold truncate">{pr.request_number}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            דרישת תשלום • נוצר {formatDate(pr.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {pr.status !== "converted" && (
            <Link href={`/payment-requests/${id}/edit`}>
              <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">ערוך</Button>
            </Link>
          )}
          <Link href={`/payment-requests/${id}/print`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">הדפס / PDF</Button>
          </Link>
          {canConvert && (
            <Button
              size="sm"
              className="touch-manipulation min-h-[44px] sm:min-h-0"
              onClick={() => window.confirm("להמיר את דרישת התשלום לחשבונית? התשלום יסומן כשולם.") && convertMutation.mutate()}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? "ממיר..." : "המר לחשבונית"}
            </Button>
          )}
          {pr.status === "converted" && pr.converted_invoice_id && (
            <Link href={`/invoices/${pr.converted_invoice_id}`}>
              <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">צפה בחשבונית</Button>
            </Link>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="touch-manipulation min-h-[44px] sm:min-h-0"
            onClick={() => window.confirm("למחוק?") && deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            מחק
          </Button>
          <Link href="/payment-requests">
            <Button variant="ghost" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">חזור</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>פרטי לקוח</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>סטטוס</CardTitle></CardHeader>
          <CardContent>
            <p>{getStatusLabel(pr.status)}</p>
            {pr.due_date && (
              <p className="mt-2 text-muted-foreground">תאריך פירעון: {formatDate(pr.due_date)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>פריטים</CardTitle></CardHeader>
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
              <div className="flex justify-between gap-4 pt-2 border-t">
                <span className="font-semibold">סה"כ לתשלום:</span>
                <span className="text-xl sm:text-2xl font-bold">{formatCurrency(pr.total ?? 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(pr.notes || (showEditDate && wasEdited)) && (
        <Card className="mt-6">
          <CardHeader><CardTitle>הערות</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pr.notes && <p className="whitespace-pre-wrap">{pr.notes}</p>}
            {showEditDate && wasEdited && (
              <p className="text-xs text-muted-foreground">נערך לאחרונה: {formatDate(pr.updated_at)}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
