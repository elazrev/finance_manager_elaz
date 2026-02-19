"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PAYMENT_STATUSES } from "@/lib/constants";
import type { Invoice } from "@/types";

function InvoicesContent() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/invoices?${params}`);
      const j = await res.json();
      return (j.data || []) as Invoice[];
    },
  });

  const getStatusLabel = (status: string) =>
    PAYMENT_STATUSES.find((s) => s.value === status)?.label || status;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      partially_paid: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getClientName = (inv: Invoice) => {
    const c = inv as Invoice & { clients?: { name?: string } };
    return c.clients?.name ?? "ללא לקוח";
  };

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">חשבוניות</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          ניהול חשבוניות וקבלות
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>רשימת חשבוניות</CardTitle>
          <CardDescription>
            {invoices.length} חשבוניות | סינון לפי סטטוס תשלום
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              <option value="">כל הסטטוסים</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">עדיין לא נוצרו חשבוניות</p>
              <Link href="/invoices/new">
                <Button variant="outline" className="touch-manipulation min-h-[44px]">צור חשבונית ראשונה</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile: card layout */}
              <div className="md:hidden space-y-3">
                {invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-manipulation"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{inv.invoice_number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(inv.payment_status)}`}>
                        {getStatusLabel(inv.payment_status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{getClientName(inv)}</p>
                    <p className="text-sm text-muted-foreground mb-2">{formatDate(inv.created_at)}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{formatCurrency(inv.total ?? 0)}</span>
                      <span className="text-sm text-primary">צפה ←</span>
                    </div>
                  </Link>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">מס' חשבונית</th>
                      <th className="p-2">לקוח</th>
                      <th className="p-2">סטטוס</th>
                      <th className="p-2">תאריך</th>
                      <th className="p-2">סכום</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          <Link href={`/invoices/${inv.id}`} className="hover:underline">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="p-2 text-muted-foreground">{getClientName(inv)}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              inv.payment_status
                            )}`}
                          >
                            {getStatusLabel(inv.payment_status)}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{formatDate(inv.created_at)}</td>
                        <td className="p-2 font-bold">{formatCurrency(inv.total ?? 0)}</td>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-0 sm:px-4 p-8">טוען...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
