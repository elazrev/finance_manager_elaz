"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { QUOTE_STATUSES } from "@/lib/constants";
import { Quote } from "@/types";

export default function QuotesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/quotes");
        const result = await response.json();
        
        if (!response.ok) {
          // If it's an auth error, return empty array instead of crashing
          if (response.status === 401) {
            return [] as Quote[];
          }
          throw new Error(result.error || "שגיאה בטעינת הצעות");
        }
        
        // Make sure result.data exists
        return (result.data || []) as Quote[];
      } catch (err: any) {
        console.error("Error fetching quotes:", err);
        // Return empty array instead of throwing to prevent crash
        return [] as Quote[];
      }
    },
    retry: false, // Don't retry on error
  });

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
          <p className="text-muted-foreground">טוען הצעות...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">שגיאה בטעינת הצעות</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "שגיאה לא ידועה"}
          </p>
          <Link href="/quotes/new">
            <Button variant="outline">צור הצעה חדשה</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">הצעות מחיר</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          ניהול הצעות מחיר ללקוחות
        </p>
      </div>

      {!data || data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>רשימת הצעות</CardTitle>
            <CardDescription>כל הצעות המחיר שלך במקום אחד</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                עדיין לא נוצרו הצעות מחיר
              </p>
              <Link href="/quotes/new">
                <Button variant="outline">צור הצעה ראשונה</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>רשימת הצעות</CardTitle>
            <CardDescription>
              {data.length} הצעות מחיר בסך הכל
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">
                          {quote.quote_number}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            quote.status
                          )}`}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          תאריך יצירה: {formatDate(quote.created_at)}
                        </p>
                        {quote.valid_until && (
                          <p>תוקף עד: {formatDate(quote.valid_until)}</p>
                        )}
                        {quote.client_id && (
                          <p>לקוח: {
                            typeof quote.client_id === 'object' && quote.client_id !== null 
                              ? (quote.client_id as any).name || "לא זמין"
                              : String(quote.client_id)
                          }</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right sm:text-left sm:ml-4 shrink-0">
                      <p className="text-xl sm:text-2xl font-bold">
                        {formatCurrency(quote.total || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(quote.items) ? quote.items.length : 0} פריטים
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/quotes/${quote.id}`}>
                      <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px]">צפה</Button>
                    </Link>
                    {quote.status === "draft" && (
                      <Button variant="outline" size="sm">
                        ערוך
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
