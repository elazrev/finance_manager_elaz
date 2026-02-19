"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatCurrency } from "@/lib/formatters";
import type { Item } from "@/types";

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", showInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (showInactive) params.set("include_inactive", "true");
      const res = await fetch(`/api/items?${params}`);
      const json = await res.json();
      return (json.data || []) as Item[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה במחיקה");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const filtered = search
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          (i.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : items;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`למחוק את הפריט "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">פריטים ושירותים</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            ניהול רשימת הפריטים והשירותים שלך
          </p>
        </div>
        <Link href="/items/new">
          <Button className="touch-manipulation min-h-[44px]">+ הוסף פריט חדש</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>רשימת פריטים</CardTitle>
          <CardDescription>
            {filtered.length} פריטים | בחר פריט להכנסה מהירה לחשבוניות והצעות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              placeholder="חיפוש לפי שם או תיאור..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <label className="flex items-center gap-2 cursor-pointer touch-manipulation min-h-[44px] items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">הצג פריטים לא פעילים</span>
            </label>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {search ? "לא נמצאו פריטים תואמים" : "עדיין לא נוספו פריטים"}
              </p>
              {!search && (
                <Link href="/items/new">
                  <Button variant="outline" className="touch-manipulation min-h-[44px]">הוסף פריט ראשון</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: card layout */}
              <div className="sm:hidden space-y-3">
                {filtered.map((i) => (
                  <div
                    key={i.id}
                    className="p-4 rounded-lg border flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-lg">{i.name}</span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-xs ${
                          i.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {i.is_active ? "פעיל" : "לא פעיל"}
                      </span>
                    </div>
                    {(i.description) && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{i.description}</p>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold">{formatCurrency(i.price)}</span>
                      <div className="flex gap-2">
                        <Link href={`/items/${i.id}/edit`}>
                          <Button variant="ghost" size="sm" className="touch-manipulation min-h-[44px]">
                            ערוך
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive touch-manipulation min-h-[44px]"
                          onClick={() => handleDelete(i.id, i.name)}
                          disabled={deleteMutation.isPending}
                        >
                          מחק
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">שם</th>
                      <th className="p-2">תיאור</th>
                      <th className="p-2">מחיר</th>
                      <th className="p-2">סטטוס</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((i) => (
                      <tr key={i.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{i.name}</td>
                        <td className="p-2 text-muted-foreground max-w-[200px] truncate">
                          {i.description || "—"}
                        </td>
                        <td className="p-2 font-bold">{formatCurrency(i.price)}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              i.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {i.is_active ? "פעיל" : "לא פעיל"}
                          </span>
                        </td>
                        <td className="p-2 flex gap-1 justify-end">
                          <Link href={`/items/${i.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              ערוך
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(i.id, i.name)}
                            disabled={deleteMutation.isPending}
                          >
                            מחק
                          </Button>
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
