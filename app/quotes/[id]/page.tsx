"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { QUOTE_STATUSES } from "@/lib/constants";
import Link from "next/link";
import type { Quote, UserSettings } from "@/types";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { data: quote, isLoading, error } = useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const response = await fetch(`/api/quotes/${id}`);
      if (!response.ok) {
        throw new Error("שגיאה בטעינת הצעה");
      }
      const result = await response.json();
      return result.data as Quote;
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
  const wasEdited = quote && quote.updated_at && quote.created_at && new Date(quote.updated_at).getTime() - new Date(quote.created_at).getTime() > 2000;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה במחיקה");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      router.push("/quotes");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotes/${id}/send-email`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "שגיאה בשליחה");
      return j;
    },
    onSuccess: () => {
      setEmailError(null);
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
    },
    onError: (err: Error) => setEmailError(err.message),
  });

  const clientEmail = (quote as { clients?: { email?: string } })?.clients?.email;

  const getStatusLabel = (status: string) => {
    return QUOTE_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      expired: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">טוען פרטי הצעה...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">שגיאה בטעינת הצעה</p>
          <Button variant="outline" asChild>
            <Link href="/quotes">חזור לרשימת הצעות</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-bold truncate">הצעה #{quote.quote_number}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
            <span
              className={`px-3 py-1 rounded text-sm font-medium shrink-0 ${getStatusColor(
                quote.status
              )}`}
            >
              {getStatusLabel(quote.status)}
            </span>
            <span className="text-sm sm:text-base text-muted-foreground">
              נוצר ב-{formatDate(quote.created_at)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href={`/quotes/${id}/edit`}>
            <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">ערוך</Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            className="touch-manipulation min-h-[44px] sm:min-h-0"
            onClick={() => window.confirm("למחוק את הצעת המחיר?") && deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            מחק
          </Button>
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px] sm:min-h-0">חזור</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>פרטי הצעה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">מספר הצעה:</span>
              <p className="font-semibold">{quote.quote_number}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">סטטוס:</span>
              <p className="font-semibold">{getStatusLabel(quote.status)}</p>
            </div>
            {quote.valid_until && (
              <div>
                <span className="text-sm text-muted-foreground">תוקף עד:</span>
                <p className="font-semibold">{formatDate(quote.valid_until)}</p>
              </div>
            )}
            {quote.sent_at && (
              <div>
                <span className="text-sm text-muted-foreground">נשלח ב:</span>
                <p className="font-semibold">{formatDate(quote.sent_at)}</p>
              </div>
            )}
            {quote.accepted_at && (
              <div>
                <span className="text-sm text-muted-foreground">אושר ב:</span>
                <p className="font-semibold">{formatDate(quote.accepted_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סיכום כספי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">סה"כ לפני מע״מ:</span>
              <span className="font-semibold">{formatCurrency(quote.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">מע״מ (עוסק פטור):</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>סה"כ לתשלום (כולל מע״מ):</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">עוסק פטור - המחיר פטור ממע״מ</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>פריטים</CardTitle>
          <CardDescription>רשימת הפריטים והשירותים</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: card layout for items */}
          <div className="md:hidden space-y-3">
            {quote.items.map((item, index) => (
              <div key={index} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  <span className="font-semibold">{formatCurrency(item.total)}</span>
                </div>
                <p className="font-medium mb-1">{item.description}</p>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mb-2">{item.notes}</p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>כמות: {item.quantity}</span>
                  <span>מחיר: {formatCurrency(item.unit_price)}</span>
                  <span>הנחה: {item.discount ? `${item.discount}%` : "-"}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-2">מס'</th>
                  <th className="text-right p-2">תיאור</th>
                  <th className="text-right p-2">כמות</th>
                  <th className="text-right p-2">מחיר יחידה</th>
                  <th className="text-right p-2">הנחה</th>
                  <th className="text-right p-2">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{formatCurrency(item.unit_price)}</td>
                    <td className="p-2">
                      {item.discount ? `${item.discount}%` : "-"}
                    </td>
                    <td className="p-2 font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {(quote.notes || (showEditDate && wasEdited)) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>הערות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quote.notes && <p className="whitespace-pre-wrap">{quote.notes}</p>}
            {showEditDate && wasEdited && (
              <p className="text-xs text-muted-foreground">נערך לאחרונה: {formatDate(quote.updated_at)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {(emailError || deleteMutation.isError) && (
        <p className="text-sm text-destructive mb-4">{emailError || deleteMutation.error?.message}</p>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-4 justify-end">
        {quote.status === "draft" && (
          <Button variant="outline" className="touch-manipulation min-h-[44px]">ערוך</Button>
        )}
        {quote.status === "accepted" && (
          <Link href={`/invoices/new?client_id=${quote.client_id || ""}`}>
            <Button className="touch-manipulation min-h-[44px]">המר לחשבונית</Button>
          </Link>
        )}
        <Link href={`/quotes/${id}/print`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="touch-manipulation min-h-[44px]">הדפס / PDF</Button>
        </Link>
        {clientEmail ? (
          <Button
            variant="outline"
            className="touch-manipulation min-h-[44px]"
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? "שולח..." : "שלח אימייל"}
          </Button>
        ) : (
          <Button variant="outline" className="touch-manipulation min-h-[44px]" disabled title="ללקוח אין כתובת אימייל">
            שלח אימייל
          </Button>
        )}
      </div>
    </div>
  );
}
