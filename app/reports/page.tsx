"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { QUOTE_STATUSES } from "@/lib/constants";
import { exportReportToExcel } from "@/lib/excel-export";

type ReportType = "income" | "summary" | "debtors" | "clients" | "quotes" | null;

const REPORT_CARDS: { id: ReportType; title: string; desc: string }[] = [
  { id: "income", title: "ספר הכנסות", desc: "דוח הכנסות לפי דרישות מס הכנסה" },
  { id: "summary", title: "דוח חודשי/שנתי", desc: "סיכום הכנסות לפי תקופה" },
  { id: "debtors", title: "דוח חייבים", desc: "מעקב אחר תשלומים ממתינים" },
  { id: "clients", title: "דוח לקוחות", desc: "פעילות לפי לקוח" },
  { id: "quotes", title: "דוח הצעות", desc: "מעקב אחר סטטוס הצעות מחיר" },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  const { data: incomeData, isLoading: incomeLoading, isError: incomeError } = useQuery({
    queryKey: ["reports", "income", from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "income" });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בטעינת הדוח");
      }
      return res.json();
    },
    enabled: activeReport === "income",
  });

  const { data: summaryData, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ["reports", "summary", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "summary", year: year || String(new Date().getFullYear()) });
      if (month) params.set("month", month);
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בטעינת הדוח");
      }
      return res.json();
    },
    enabled: activeReport === "summary",
  });

  const { data: debtorsData, isLoading: debtorsLoading } = useQuery({
    queryKey: ["reports", "debtors"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=debtors");
      if (!res.ok) throw new Error("שגיאה");
      return res.json();
    },
    enabled: activeReport === "debtors",
  });

  const { data: clientsListData } = useQuery({
    queryKey: ["reports", "clients-list"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=clients");
      if (!res.ok) throw new Error("שגיאה");
      return res.json();
    },
    enabled: activeReport === "clients",
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["reports", "clients", selectedClientId],
    queryFn: async () => {
      const params = new URLSearchParams({ type: "clients" });
      if (selectedClientId) params.set("client_id", selectedClientId);
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("שגיאה");
      return res.json();
    },
    enabled: activeReport === "clients",
  });

  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ["reports", "quotes"],
    queryFn: async () => {
      const res = await fetch("/api/reports?type=quotes");
      if (!res.ok) throw new Error("שגיאה");
      return res.json();
    },
    enabled: activeReport === "quotes",
  });

  const isLoading =
    (activeReport === "income" && incomeLoading) ||
    (activeReport === "summary" && summaryLoading) ||
    (activeReport === "debtors" && debtorsLoading) ||
    (activeReport === "clients" && clientsLoading) ||
    (activeReport === "quotes" && quotesLoading);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">דוחות</h1>
        <p className="text-base sm:text-lg text-muted-foreground">דוחות פיננסיים וסיכומים</p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        {REPORT_CARDS.map((r) => (
          <Card
            key={r.id}
            className={`cursor-pointer transition-colors hover:bg-accent/50 ${
              activeReport === r.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setActiveReport(r.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{r.title}</CardTitle>
              <CardDescription>{r.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {activeReport && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">
                {REPORT_CARDS.find((r) => r.id === activeReport)?.title}
              </CardTitle>
              <CardDescription>
                {REPORT_CARDS.find((r) => r.id === activeReport)?.desc}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`/reports/print?type=${activeReport}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}${year ? `&year=${year}` : ""}${month ? `&month=${month}` : ""}${selectedClientId ? `&client_id=${selectedClientId}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  הדפס / שמור כ-PDF
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = { from, to, year, month };
                  if (activeReport === "income" && incomeData?.data) {
                    exportReportToExcel("income", incomeData.data, params);
                  } else if (activeReport === "summary" && summaryData?.data) {
                    exportReportToExcel("summary", summaryData.data, params);
                  } else if (activeReport === "debtors" && debtorsData?.data) {
                    exportReportToExcel("debtors", debtorsData.data);
                  } else if (activeReport === "clients") {
                    exportReportToExcel(
                      "clients",
                      selectedClientId ? clientsData?.data : clientsListData?.data,
                      { clientId: selectedClientId }
                    );
                  } else if (activeReport === "quotes" && quotesData?.data) {
                    exportReportToExcel("quotes", quotesData.data);
                  }
                }}
                disabled={isLoading || !(
                  (activeReport === "income" && incomeData?.data) ||
                  (activeReport === "summary" && summaryData?.data) ||
                  (activeReport === "debtors" && debtorsData?.data) ||
                  (activeReport === "clients" && (clientsData?.data || clientsListData?.data)) ||
                  (activeReport === "quotes" && quotesData?.data)
                )}
              >
                ייצא ל-Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeReport === "income" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <label className="text-sm text-muted-foreground">מתאריך</label>
                    <Input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full sm:w-40"
                    />
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <label className="text-sm text-muted-foreground">עד תאריך</label>
                    <Input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full sm:w-40"
                    />
                  </div>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground py-8">טוען...</p>
                ) : incomeError ? (
                  <p className="text-destructive py-4">שגיאה בטעינת הדוח. נסה שוב.</p>
                ) : incomeData?.data !== undefined ? (
                  <div>
                    <p className="text-lg sm:text-xl font-bold mb-4">
                      סה"כ הכנסות: {formatCurrency(incomeData.data.totalIncome)}
                    </p>
                    {/* Mobile: cards */}
                    <div className="md:hidden space-y-3">
                      {incomeData.data.invoices.map((inv: any) => (
                        <Link
                          key={inv.id}
                          href={`/invoices/${inv.id}`}
                          className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold">{inv.invoice_number}</span>
                            <span className="font-bold">{inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{inv.clients?.name ?? "ללא לקוח"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(inv.paid_at || inv.created_at)}</p>
                          <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                        </Link>
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2">מס' חשבונית</th>
                            <th className="p-2">לקוח</th>
                            <th className="p-2">תאריך תשלום</th>
                            <th className="p-2">סכום</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeData.data.invoices.map((inv: any) => (
                            <tr key={inv.id} className="border-b">
                              <td className="p-2 font-medium">{inv.invoice_number}</td>
                              <td className="p-2">{inv.clients?.name ?? "ללא לקוח"}</td>
                              <td className="p-2">{formatDate(inv.paid_at || inv.created_at)}</td>
                              <td className="p-2 font-bold">
                                {inv.type === "credit" ? "-" : ""}
                                {formatCurrency(inv.total)}
                              </td>
                              <td className="p-2">
                                <Link href={`/invoices/${inv.id}`}>
                                  <Button variant="ghost" size="sm">צפה</Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 font-bold bg-muted/50">
                            <td colSpan={2} className="p-2 text-left">סה"כ</td>
                            <td className="p-2"></td>
                            <td className="p-2">{formatCurrency(incomeData.data.totalIncome)}</td>
                            <td className="p-2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                      {incomeData.data.invoices.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">
                          אין חשבוניות בתקופה הנבחרת
                        </p>
                      )}
                  </div>
                ) : null}
              </div>
            )}

            {activeReport === "summary" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <label className="text-sm text-muted-foreground">שנה</label>
                    <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-full sm:w-32">
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <label className="text-sm text-muted-foreground">חודש (אופציונלי)</label>
                    <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full sm:w-40">
                      <option value="">כל השנה</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          חודש {i + 1}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground py-8">טוען...</p>
                ) : summaryError ? (
                  <p className="text-destructive py-4">שגיאה בטעינת הדוח. נסה שוב.</p>
                ) : summaryData?.data !== undefined ? (
                  <div className="space-y-4">
                    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                      <p className="text-lg font-medium">תקופה: <strong>{summaryData.data.period}</strong></p>
                      <p>הכנסות (חשבוניות ששולמו): {formatCurrency(summaryData.data.income)}</p>
                      <p>זיכויים: {formatCurrency(summaryData.data.credits)}</p>
                      <p className="text-xl font-bold pt-2 border-t">סה"כ הכנסות נטו: {formatCurrency(summaryData.data.netIncome)}</p>
                      <p>הוצאות: {formatCurrency(summaryData.data.totalExpenses ?? 0)}</p>
                      <p className="text-xl font-bold pt-2 border-t">
                        רווח (הכנסות − הוצאות): {formatCurrency(summaryData.data.profit ?? summaryData.data.netIncome)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {summaryData.data.invoiceCount} חשבוניות בתקופה
                        {(summaryData.data.paidInvoiceCount ?? 0) > 0 && (
                          <> ({summaryData.data.paidInvoiceCount} ששולמו)</>
                        )}
                      </p>
                    </div>
                    {(summaryData.data.invoices?.length ?? 0) > 0 ? (
                      <>
                        <div className="md:hidden space-y-3">
                          {summaryData.data.invoices.map((inv: any) => (
                            <Link
                              key={inv.id}
                              href={`/invoices/${inv.id}`}
                              className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold">{inv.invoice_number}</span>
                                <span className="font-bold">{inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{inv.clients?.name ?? "ללא לקוח"}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(inv.paid_at || inv.created_at)}</p>
                              <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                            </Link>
                          ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="border-b">
                                <th className="p-2">מס' חשבונית</th>
                                <th className="p-2">לקוח</th>
                                <th className="p-2">תאריך תשלום</th>
                                <th className="p-2">סכום</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {summaryData.data.invoices.map((inv: any) => (
                              <tr key={inv.id} className="border-b">
                                <td className="p-2 font-medium">{inv.invoice_number}</td>
                                <td className="p-2">{inv.clients?.name ?? "ללא לקוח"}</td>
                                <td className="p-2">{formatDate(inv.paid_at || inv.created_at)}</td>
                                <td className="p-2 font-bold">
                                  {inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}
                                </td>
                                <td className="p-2">
                                  <Link href={`/invoices/${inv.id}`}>
                                    <Button variant="ghost" size="sm">צפה</Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 font-bold bg-muted/50">
                              <td colSpan={2} className="p-2 text-left">סה"כ נטו</td>
                              <td className="p-2"></td>
                              <td className="p-2">{formatCurrency(summaryData.data.netIncome)}</td>
                              <td className="p-2"></td>
                            </tr>
                          </tfoot>
                        </table>
                        </div>
                      </>
                    ) : summaryData.data.invoiceCount === 0 ? (
                      <p className="text-muted-foreground italic">אין חשבוניות בתקופה הנבחרת</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

            {activeReport === "debtors" && (
              <>
                {isLoading ? (
                  <p className="text-muted-foreground py-8">טוען...</p>
                ) : debtorsData?.data ? (
                  <div>
                    <p className="text-lg sm:text-xl font-bold mb-4">
                      סה"כ ממתין: {formatCurrency(debtorsData.data.totalPending)}
                    </p>
                    <div className="md:hidden space-y-3">
                      {debtorsData.data.invoices.map((inv: any) => (
                        <Link
                          key={inv.id}
                          href={`/invoices/${inv.id}`}
                          className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold">{inv.invoice_number}</span>
                            <span className="font-bold">{formatCurrency(inv.total)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{inv.clients?.name ?? "ללא לקוח"}</p>
                          <p className="text-xs text-muted-foreground">פירעון: {formatDate(inv.due_date)}</p>
                          <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                        </Link>
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2">מס' חשבונית</th>
                            <th className="p-2">לקוח</th>
                            <th className="p-2">תאריך פירעון</th>
                            <th className="p-2">סכום</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtorsData.data.invoices.map((inv: any) => (
                            <tr key={inv.id} className="border-b">
                              <td className="p-2">{inv.invoice_number}</td>
                              <td className="p-2">
                                {inv.clients?.name ?? "ללא לקוח"}
                              </td>
                              <td className="p-2">{formatDate(inv.due_date)}</td>
                              <td className="p-2 font-bold">{formatCurrency(inv.total)}</td>
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
                      {debtorsData.data.invoices.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">
                          אין חשבוניות ממתינות
                        </p>
                      )}
                  </div>
                ) : null}
              </>
            )}

            {activeReport === "clients" && (
              <div className="space-y-4">
                <div className="min-w-0">
                  <label className="text-sm text-muted-foreground">בחר לקוח לראות פירוט עסקאות</label>
                  <Select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full sm:max-w-md mt-1"
                  >
                    <option value="">— סיכום כל הלקוחות —</option>
                    {Array.isArray(clientsListData?.data)
                      ? (clientsListData.data as { client_id?: string; name?: string; count?: number; total?: number }[]).map((row: any) => (
                          <option key={row.client_id || "none"} value={row.client_id || ""}>
                            {row.name} ({row.count} חשבוניות, {formatCurrency(row.total)})
                          </option>
                        ))
                      : null}
                  </Select>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground py-8">טוען...</p>
                ) : clientsData?.data ? (
                  selectedClientId && !Array.isArray(clientsData.data) ? (
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <p className="text-lg font-bold">לקוח: {(clientsData.data as any).client?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          סה"כ חשבוניות: {formatCurrency((clientsData.data as any).totalInvoices)} | הצעות: {formatCurrency((clientsData.data as any).totalQuotes)}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">חשבוניות</h3>
                        <div className="md:hidden space-y-3">
                          {((clientsData.data as any).invoices || []).map((inv: any) => (
                            <Link
                              key={inv.id}
                              href={`/invoices/${inv.id}`}
                              className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold">{inv.invoice_number}</span>
                                <span className="font-bold">{inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{formatDate(inv.paid_at || inv.created_at)} · {inv.payment_status}</p>
                              <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                            </Link>
                          ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="border-b">
                                <th className="p-2">מס'</th>
                                <th className="p-2">תאריך תשלום</th>
                                <th className="p-2">סטטוס</th>
                                <th className="p-2">סכום</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {((clientsData.data as any).invoices || []).map((inv: any) => (
                                <tr key={inv.id} className="border-b">
                                  <td className="p-2 font-medium">{inv.invoice_number}</td>
                                  <td className="p-2">{formatDate(inv.paid_at || inv.created_at)}</td>
                                  <td className="p-2 text-sm">{inv.payment_status}</td>
                                  <td className="p-2 font-bold">
                                    {inv.type === "credit" ? "-" : ""}{formatCurrency(inv.total)}
                                  </td>
                                  <td className="p-2">
                                    <Link href={`/invoices/${inv.id}`}>
                                      <Button variant="ghost" size="sm">צפה</Button>
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 font-bold bg-muted/50">
                                <td colSpan={2} className="p-2 text-left">סה"כ</td>
                                <td className="p-2"></td>
                                <td className="p-2">{formatCurrency((clientsData.data as any).totalInvoices)}</td>
                                <td className="p-2"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {((clientsData.data as any).invoices || []).length === 0 && (
                          <p className="text-muted-foreground py-4">אין חשבוניות</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">הצעות מחיר</h3>
                        <div className="md:hidden space-y-3">
                          {((clientsData.data as any).quotes || []).map((q: any) => (
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
                          <table className="w-full text-right">
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
                              {((clientsData.data as any).quotes || []).map((q: any) => (
                                <tr key={q.id} className="border-b">
                                  <td className="p-2 font-medium">{q.quote_number}</td>
                                  <td className="p-2">{formatDate(q.created_at)}</td>
                                  <td className="p-2 text-sm">{QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}</td>
                                  <td className="p-2 font-bold">{formatCurrency(q.total)}</td>
                                  <td className="p-2">
                                    <Link href={`/quotes/${q.id}`}>
                                      <Button variant="ghost" size="sm">צפה</Button>
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 font-bold bg-muted/50">
                                <td colSpan={2} className="p-2 text-left">סה"כ</td>
                                <td className="p-2"></td>
                                <td className="p-2">{formatCurrency((clientsData.data as any).totalQuotes)}</td>
                                <td className="p-2"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {((clientsData.data as any).quotes || []).length === 0 && (
                          <p className="text-muted-foreground py-4">אין הצעות מחיר</p>
                        )}
                      </div>
                    </div>
                  ) : Array.isArray(clientsData.data) ? (
                    <>
                      <div className="md:hidden space-y-3">
                        {(clientsData.data as any[]).map((row: any) => (
                          <div
                            key={row.client_id || "none"}
                            className="block p-4 rounded-lg border bg-muted/30"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold">{row.name}</span>
                              <span className="font-bold">{formatCurrency(row.total)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{row.count} חשבוניות</p>
                            {row.client_id && (
                              <Button variant="ghost" size="sm" onClick={() => setSelectedClientId(row.client_id)} className="mt-2 touch-manipulation">
                                פירוט עסקאות
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-right">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2">לקוח</th>
                              <th className="p-2">חשבוניות</th>
                              <th className="p-2">סה"כ</th>
                              <th className="p-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(clientsData.data as any[]).map((row: any) => (
                            <tr key={row.client_id || "none"} className="border-b">
                              <td className="p-2 font-medium">{row.name}</td>
                              <td className="p-2">{row.count}</td>
                              <td className="p-2 font-bold">{formatCurrency(row.total)}</td>
                              <td className="p-2">
                                {row.client_id && (
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedClientId(row.client_id)}>
                                    פירוט עסקאות
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                      {clientsData.data.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">אין נתונים</p>
                      )}
                    </>
                  ) : null
                ) : null}
              </div>
            )}

            {activeReport === "quotes" && (
              <>
                {isLoading ? (
                  <p className="text-muted-foreground py-8">טוען...</p>
                ) : quotesData?.data ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <p className="text-sm sm:text-base">סה"כ הצעות: {quotesData.data.totalQuotes}</p>
                      <p className="text-sm sm:text-base">ערך כולל: {formatCurrency(quotesData.data.totalValue)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {Object.entries(quotesData.data.byStatus || {}).map(([s, n]) => (
                        <span key={s} className="px-2 py-1 bg-muted rounded">
                          {s}: {String(n)}
                        </span>
                      ))}
                    </div>
                    <div className="md:hidden space-y-3">
                      {quotesData.data.quotes.map((q: any) => (
                        <Link
                          key={q.id}
                          href={`/quotes/${q.id}`}
                          className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold">{q.quote_number}</span>
                            <span className="font-bold">{formatCurrency(q.total)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{q.clients?.name ?? "ללא לקוח"}</p>
                          <p className="text-xs">
                            <span className={`px-2 py-0.5 rounded ${
                              q.status === "accepted" ? "bg-green-100 text-green-800" :
                              q.status === "rejected" || q.status === "expired" ? "bg-gray-100 text-gray-600" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}
                            </span>
                          </p>
                          <span className="text-sm text-primary mt-2 inline-block">צפה ←</span>
                        </Link>
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2">מס' הצעה</th>
                            <th className="p-2">לקוח</th>
                            <th className="p-2">סטטוס</th>
                            <th className="p-2">סכום</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotesData.data.quotes.map((q: any) => (
                            <tr key={q.id} className="border-b">
                              <td className="p-2">{q.quote_number}</td>
                              <td className="p-2">{q.clients?.name ?? "ללא לקוח"}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  q.status === "accepted" ? "bg-green-100 text-green-800" :
                                  q.status === "rejected" || q.status === "expired" ? "bg-gray-100 text-gray-600" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}
                                </span>
                              </td>
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
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
