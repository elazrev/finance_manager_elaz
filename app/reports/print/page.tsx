"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { QUOTE_STATUSES } from "@/lib/constants";
import Link from "next/link";

function ReportsPrintContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "income";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const year = searchParams.get("year") || String(new Date().getFullYear());
  const month = searchParams.get("month") || "";
  const clientId = searchParams.get("client_id") || "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports-print", type, from, to, year, month, clientId],
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (year) params.set("year", year);
      if (month) params.set("month", month);
      if (clientId) params.set("client_id", clientId);
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בטעינת הדוח");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" dir="rtl">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }
  if (isError || !data?.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" dir="rtl">
        <p className="text-destructive">שגיאה בטעינת הדוח. חזור ונסה שוב.</p>
        <Link href="/reports" className="mt-4 text-primary hover:underline">חזור לדוחות</Link>
      </div>
    );
  }

  const getTitle = () => {
    if (type === "clients" && clientId && data?.data?.client?.name) {
      return `דוח לקוח: ${data.data.client.name}`;
    }
    const titles: Record<string, string> = {
      income: "ספר הכנסות",
      summary: "דוח חודשי/שנתי",
      debtors: "דוח חייבים",
      clients: "דוח לקוחות",
      quotes: "דוח הצעות",
    };
    return titles[type] || "דוח";
  };
  const title = getTitle();

  return (
    <div className="p-8 max-w-4xl mx-auto print:p-4" dir="rtl">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            הדפס / שמור כ-PDF
          </button>
          <Link href="/reports" className="text-sm text-muted-foreground hover:underline">
            חזור
          </Link>
        </div>
      </div>

      <div className="print:block">
        <h1 className="text-2xl font-bold mb-6 print:mb-4">{title}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          הופק: {formatDate(new Date().toISOString())}
        </p>

        {type === "income" && (
          <div>
            <p className="text-lg font-bold mb-4">
              סה"כ הכנסות: {formatCurrency(data.data.totalIncome)}
            </p>
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-2">מס' חשבונית</th>
                  <th className="p-2">לקוח</th>
                  <th className="p-2">תאריך תשלום</th>
                  <th className="p-2">סכום</th>
                </tr>
              </thead>
              <tbody>
                {(data.data.invoices || []).map((inv: any) => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-2">{inv.invoice_number}</td>
                    <td className="p-2">{inv.clients?.name ?? "ללא לקוח"}</td>
                    <td className="p-2">{formatDate(inv.paid_at || inv.created_at)}</td>
                    <td className="p-2 font-bold">
                      {inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={2} className="p-2 text-left">סה"כ</td>
                  <td className="p-2"></td>
                  <td className="p-2">{formatCurrency(data.data.totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {type === "summary" && (
          <div className="space-y-4">
            <div>
              <p>תקופה: <strong>{data.data.period ?? data.data.periodKey}</strong></p>
              <p>הכנסות (חשבוניות ששולמו): {formatCurrency(data.data.income)}</p>
              <p>זיכויים: {formatCurrency(data.data.credits)}</p>
              <p className="font-semibold">סה"כ הכנסות נטו: {formatCurrency(data.data.netIncome)}</p>
              <p>הוצאות: {formatCurrency(data.data.totalExpenses ?? 0)}</p>
              <p className="text-lg font-bold">רווח (הכנסות − הוצאות): {formatCurrency(data.data.profit ?? data.data.netIncome)}</p>
              <p className="text-sm text-muted-foreground">
                {data.data.invoiceCount} חשבוניות בתקופה
              </p>
            </div>
            {(data.data.invoices?.length ?? 0) > 0 && (
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">מס' חשבונית</th>
                    <th className="p-2">לקוח</th>
                    <th className="p-2">תאריך תשלום</th>
                    <th className="p-2">סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data.invoices || []).map((inv: any) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-2">{inv.invoice_number}</td>
                      <td className="p-2">{inv.clients?.name ?? "ללא לקוח"}</td>
                      <td className="p-2">{formatDate(inv.paid_at || inv.created_at)}</td>
                      <td className="p-2 font-bold">
                        {inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={2} className="p-2 text-left">סה"כ נטו</td>
                    <td className="p-2"></td>
                    <td className="p-2">{formatCurrency(data.data.netIncome)}</td>
                  </tr>
                  {typeof (data.data.totalExpenses ?? 0) === "number" && (
                    <tr className="font-bold">
                      <td colSpan={2} className="p-2 text-left">הוצאות</td>
                      <td className="p-2"></td>
                      <td className="p-2">{formatCurrency(data.data.totalExpenses)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 font-bold">
                    <td colSpan={2} className="p-2 text-left">רווח</td>
                    <td className="p-2"></td>
                    <td className="p-2">{formatCurrency(data.data.profit ?? data.data.netIncome)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {type === "debtors" && (
          <div>
            <p className="text-lg font-bold mb-4">
              סה"כ ממתין: {formatCurrency(data.data.totalPending)}
            </p>
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-2">מס' חשבונית</th>
                  <th className="p-2">לקוח</th>
                  <th className="p-2">תאריך פירעון</th>
                  <th className="p-2">סכום</th>
                </tr>
              </thead>
              <tbody>
                {(data.data.invoices || []).map((inv: any) => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-2">{inv.invoice_number}</td>
                    <td className="p-2">{inv.clients?.name ?? "ללא לקוח"}</td>
                    <td className="p-2">{formatDate(inv.due_date)}</td>
                    <td className="p-2 font-bold">{formatCurrency(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={2} className="p-2 text-left">סה"כ</td>
                  <td className="p-2"></td>
                  <td className="p-2">{formatCurrency(data.data.totalPending)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {type === "clients" && (
          clientId && data.data?.invoices ? (
            <div className="space-y-6">
              <p className="text-lg font-bold">לקוח: {data.data.client?.name}</p>
              <div>
                <h3 className="font-semibold mb-2">חשבוניות</h3>
                <table className="w-full border-collapse text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">מס'</th>
                      <th className="p-2">תאריך תשלום</th>
                      <th className="p-2">סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.data.invoices || []).map((inv: any) => (
                      <tr key={inv.id} className="border-b">
                        <td className="p-2">{inv.invoice_number}</td>
                        <td className="p-2">{formatDate(inv.paid_at || inv.created_at)}</td>
                        <td className="p-2 font-bold">{inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td colSpan={2} className="p-2 text-left">סה"כ חשבוניות</td>
                      <td className="p-2">{formatCurrency(data.data.totalInvoices)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div>
                <h3 className="font-semibold mb-2">הצעות מחיר</h3>
                <table className="w-full border-collapse text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">מס' הצעה</th>
                      <th className="p-2">תאריך</th>
                      <th className="p-2">סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.data.quotes || []).map((q: any) => (
                      <tr key={q.id} className="border-b">
                        <td className="p-2">{q.quote_number}</td>
                        <td className="p-2">{formatDate(q.created_at)}</td>
                        <td className="p-2 font-bold">{formatCurrency(q.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td colSpan={2} className="p-2 text-left">סה"כ הצעות</td>
                      <td className="p-2">{formatCurrency(data.data.totalQuotes)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-2">לקוח</th>
                  <th className="p-2">חשבוניות</th>
                  <th className="p-2">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(data.data) ? data.data : []).map((row: any, i: number) => (
                  <tr key={row.client_id || i} className="border-b">
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2">{row.count}</td>
                    <td className="p-2 font-bold">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {type === "quotes" && (
          <div className="space-y-4">
            <p>סה"כ הצעות: {data.data.totalQuotes} | ערך: {formatCurrency(data.data.totalValue)}</p>
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-2">מס' הצעה</th>
                  <th className="p-2">לקוח</th>
                  <th className="p-2">סטטוס</th>
                  <th className="p-2">סכום</th>
                </tr>
              </thead>
              <tbody>
                {(data.data.quotes || []).map((q: any) => (
                  <tr key={q.id} className="border-b">
                    <td className="p-2">{q.quote_number}</td>
                    <td className="p-2">{q.clients?.name ?? "ללא לקוח"}</td>
                    <td className="p-2">{QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}</td>
                    <td className="p-2 font-bold">{formatCurrency(q.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPrintPage() {
  return (
    <Suspense fallback={<div className="p-4">טוען...</div>}>
      <ReportsPrintContent />
    </Suspense>
  );
}
