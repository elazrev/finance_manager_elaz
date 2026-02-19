"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PAYMENT_REQUEST_STATUSES } from "@/lib/constants";
import type { PaymentRequest } from "@/types";

export default function PaymentRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["payment-requests", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/payment-requests?${params}`);
      const j = await res.json();
      return (j.data || []) as (PaymentRequest & { clients?: { name?: string } })[];
    },
  });

  const getStatusLabel = (status: string) =>
    PAYMENT_REQUEST_STATUSES.find((s) => s.value === status)?.label || status;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      converted: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getClientName = (r: PaymentRequest & { clients?: { name?: string } }) =>
    r.clients?.name ?? "ללא לקוח";

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">דרישות תשלום</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          מסמכים טרם חשבונית – ניתן להמיר לחשבונית בעת קבלת התשלום
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>רשימת דרישות תשלום</CardTitle>
              <CardDescription>
                {requests.length} דרישות | סינון לפי סטטוס
              </CardDescription>
            </div>
            <Link href="/payment-requests/new">
              <Button>+ צור דרישת תשלום</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              <option value="">כל הסטטוסים</option>
              {PAYMENT_REQUEST_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">עדיין לא נוצרו דרישות תשלום</p>
              <Link href="/payment-requests/new">
                <Button variant="outline">צור דרישת תשלום ראשונה</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {requests.map((r) => (
                  <Link
                    key={r.id}
                    href={`/payment-requests/${r.id}`}
                    className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-manipulation"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{r.request_number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(r.status)}`}>
                        {getStatusLabel(r.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{getClientName(r)}</p>
                    <p className="text-sm text-muted-foreground mb-2">{formatDate(r.created_at)}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{formatCurrency(r.total ?? 0)}</span>
                      <span className="text-sm text-primary">צפה ←</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">מס' דרישה</th>
                      <th className="p-2">לקוח</th>
                      <th className="p-2">סטטוס</th>
                      <th className="p-2">תאריך</th>
                      <th className="p-2">סכום</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          <Link href={`/payment-requests/${r.id}`} className="hover:underline">
                            {r.request_number}
                          </Link>
                        </td>
                        <td className="p-2 text-muted-foreground">{getClientName(r)}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(r.status)}`}
                          >
                            {getStatusLabel(r.status)}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{formatDate(r.created_at)}</td>
                        <td className="p-2 font-bold">{formatCurrency(r.total ?? 0)}</td>
                        <td className="p-2">
                          <Link href={`/payment-requests/${r.id}`}>
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
