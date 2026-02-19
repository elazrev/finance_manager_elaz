"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const PIE_COLORS = {
  pending: "#eab308",        // yellow – חשבוניות ממתינות
  paymentRequests: "#3b82f6", // blue – דרישות תשלום
  quotes: "#a855f7",         // purple – הצעות מחיר
  actualIncome: "#22c55e",    // green – שולם לחשבון
};

function MonthlyDataTile({ data }: { data: DashboardData }) {
  const pending = data.monthlyPendingInvoicesTotal ?? 0;
  const requests = data.monthlyPaymentRequestsTotal ?? 0;
  const quotes = data.monthlyQuotesTotal ?? 0;
  const actual = data.monthlyActualIncome ?? 0;
  const pieData = [
    { name: "חשבוניות ממתינות", value: Math.max(0, pending), color: PIE_COLORS.pending },
    { name: "דרישות תשלום", value: Math.max(0, requests), color: PIE_COLORS.paymentRequests },
    { name: "הצעות מחיר", value: Math.max(0, quotes), color: PIE_COLORS.quotes },
    { name: "שולם לחשבון", value: Math.max(0, actual), color: PIE_COLORS.actualIncome },
  ].filter((d) => d.value > 0);

  const isEmpty = pieData.length === 0 && actual === 0;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {isEmpty ? (
        <p className="text-sm text-muted-foreground py-4">אין נתונים</p>
      ) : (
        <>
          <div className="relative w-full aspect-square max-w-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: "_", value: 1, color: "#e5e7eb" }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="78%"
                  outerRadius="98%"
                  paddingAngle={0.5}
                >
                  {(pieData.length > 0 ? pieData : [{ name: "_", value: 1, color: "#e5e7eb" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {(pending > 0 || requests > 0 || quotes > 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-medium gap-0 pointer-events-none">
                {pending > 0 && (
                  <span style={{ color: PIE_COLORS.pending }}>{formatCurrency(pending)}</span>
                )}
                {requests > 0 && (
                  <span style={{ color: PIE_COLORS.paymentRequests }}>{formatCurrency(requests)}</span>
                )}
                {quotes > 0 && (
                  <span style={{ color: PIE_COLORS.quotes }}>{formatCurrency(quotes)}</span>
                )}
              </div>
            )}
          </div>
          <div className="pt-2 border-t w-full text-center">
            <p className="text-xs text-muted-foreground">שולם לחשבון</p>
            <p className="text-base font-semibold">{formatCurrency(actual)}</p>
          </div>
        </>
      )}
    </div>
  );
}

type DashboardData = {
  clientsCount: number;
  pendingInvoicesCount: number;
  activeQuotesCount: number;
  pendingPaymentRequestsCount: number;
  monthlyPendingInvoicesTotal?: number;
  monthlyPaymentRequestsTotal?: number;
  monthlyQuotesTotal?: number;
  monthlyActualIncome?: number;
  monthlyExpenses?: number;
  topClients?: Array<{ id: string; name: string; docCount: number }>;
  incomeByMonth?: Array<{ month: string; income: number; label: string }>;
  recentInvoices: Array<{
    id: string;
    invoice_number: string;
    total: number;
    payment_status: string;
    created_at: string;
    clients?: { name?: string } | null;
  }>;
  recentQuotes: Array<{
    id: string;
    quote_number: string;
    total: number;
    status: string;
    created_at: string;
    clients?: { name?: string } | null;
  }>;
  recentPaymentRequests: Array<{
    id: string;
    request_number: string;
    total: number;
    status: string;
    created_at: string;
    clients?: { name?: string } | null;
  }>;
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("שגיאה בטעינת הדשבורד");
      const j = await res.json();
      return j.data as DashboardData;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="container mx-auto px-0 sm:px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">דשבורד</h1>
          <p className="text-base sm:text-lg text-muted-foreground">סקירה כללית של העסק שלך</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-muted animate-pulse rounded w-24" />
                <div className="h-4 bg-muted animate-pulse rounded w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-muted-foreground py-12">טוען...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">דשבורד</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          סקירה כללית של העסק שלך
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6 sm:mb-8">
        <Link href="/reports" className="block">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-base font-medium">נתונים חודשיים</CardTitle>
              <CardDescription className="text-xs">סיכום חודש נוכחי</CardDescription>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS.pending }} />
                  חשבוניות ממתינות
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS.paymentRequests }} />
                  דרישות תשלום
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS.quotes }} />
                  הצעות מחיר
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <MonthlyDataTile data={data} />
            </CardContent>
          </Card>
        </Link>

        <Link href="/expenses" className="block">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-base font-medium">הוצאות חודשיות</CardTitle>
              <CardDescription className="text-xs">חודש נוכחי</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{formatCurrency(data.monthlyExpenses ?? 0)}</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader className="pb-1 pt-4 px-4">
            <Link href="/clients" className="hover:opacity-80">
              <CardTitle className="text-base font-medium">לקוחות</CardTitle>
            </Link>
            <CardDescription className="text-xs">סה"כ לקוחות · מובילים לפי מסמכים</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Link href="/clients">
              <p className="text-2xl font-bold hover:underline">{data.clientsCount}</p>
            </Link>
            {(data.topClients?.length ?? 0) > 0 ? (
              <ul className="mt-3 space-y-1.5 text-xs">
                {(data.topClients ?? []).slice(0, 3).map((c) => (
                  <li key={c.id} className="flex justify-between items-center gap-2">
                    <Link
                      href={`/clients/${c.id}`}
                      className="truncate text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="shrink-0 text-muted-foreground">{c.docCount} מסמכים</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Link href="/invoices?status=pending" className="block">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-base font-medium">חשבוניות ממתינות</CardTitle>
              <CardDescription className="text-xs">חשבוניות שטרם שולמו</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{data.pendingInvoicesCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/payment-requests" className="block">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-base font-medium">דרישות תשלום</CardTitle>
              <CardDescription className="text-xs">טרם הומרו</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{data.pendingPaymentRequestsCount ?? 0}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quotes" className="block">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-base font-medium">הצעות פעילות</CardTitle>
              <CardDescription className="text-xs">בטיוטה או נשלחו</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{data.activeQuotesCount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {data.incomeByMonth && data.incomeByMonth.length > 0 && (
        <Card className="mb-8 -mx-4 sm:mx-0 overflow-hidden">
          <CardHeader>
            <CardTitle>הכנסות לפי חודש</CardTitle>
            <CardDescription>6 החודשים האחרונים</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incomeByMonth} margin={{ top: 8, left: 4, right: 4 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `₪${v}`} tick={{ fontSize: 11 }} width={48} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "הכנסות"]}
                    contentStyle={{ direction: "rtl" }}
                  />
                  <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                    {data.incomeByMonth.map((entry, i) => (
                      <Cell key={i} fill={entry.income >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>פעולות אחרונות</CardTitle>
              <CardDescription>5 חשבוניות אחרונות</CardDescription>
            </div>
            <Link href="/invoices">
              <span className="text-sm text-primary hover:underline">כל החשבוניות</span>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                אין חשבוניות עדיין
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentInvoices.map((inv) => (
                  <li key={inv.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                        {inv.invoice_number}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {inv.clients?.name ?? "ללא לקוח"} · {formatDate(inv.created_at)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(inv.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>הצעות אחרונות</CardTitle>
              <CardDescription>5 הצעות מחיר אחרונות</CardDescription>
            </div>
            <Link href="/quotes">
              <span className="text-sm text-primary hover:underline">כל ההצעות</span>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentQuotes.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                אין הצעות עדיין
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentQuotes.map((q) => (
                  <li key={q.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <Link href={`/quotes/${q.id}`} className="font-medium hover:underline">
                        {q.quote_number}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {q.clients?.name ?? "ללא לקוח"} · {formatDate(q.created_at)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(q.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>דרישות תשלום אחרונות</CardTitle>
              <CardDescription>5 דרישות תשלום אחרונות</CardDescription>
            </div>
            <Link href="/payment-requests">
              <span className="text-sm text-primary hover:underline">כל הדרישות</span>
            </Link>
          </CardHeader>
          <CardContent>
            {(!data.recentPaymentRequests || data.recentPaymentRequests.length === 0) ? (
              <p className="text-muted-foreground text-center py-6">
                אין דרישות תשלום עדיין
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentPaymentRequests.map((pr) => (
                  <li key={pr.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <Link href={`/payment-requests/${pr.id}`} className="font-medium hover:underline">
                        {pr.request_number}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {pr.clients?.name ?? "ללא לקוח"} · {formatDate(pr.created_at)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(pr.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
