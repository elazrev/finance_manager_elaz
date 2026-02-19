"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import { CLIENT_TYPES } from "@/lib/constants";
import type { Client } from "@/types";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      return (json.data || []) as Client[];
    },
  });

  const getTypeLabel = (t: string) => CLIENT_TYPES.find((c) => c.value === t)?.label || t;

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">לקוחות</h1>
          <p className="text-base sm:text-lg text-muted-foreground">ניהול רשימת הלקוחות שלך</p>
        </div>
        <Link href="/clients/new">
          <Button className="touch-manipulation min-h-[44px]">+ הוסף לקוח חדש</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>רשימת לקוחות</CardTitle>
          <CardDescription>
            {clients.length} לקוחות | חיפוש וסינון
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="חיפוש לפי שם, איש קשר, אימייל או טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-40"
            >
              <option value="">כל הסוגים</option>
              {CLIENT_TYPES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">טוען...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">לא נמצאו לקוחות</p>
              <Link href="/clients/new">
                <Button variant="outline">הוסף לקוח ראשון</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {clients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-manipulation"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{c.name}</span>
                      <span className="text-sm">{getTypeLabel(c.client_type)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 truncate">{c.email || "—"}</p>
                    <p className="text-sm text-muted-foreground mb-2">{c.phone || "—"}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{formatDate(c.created_at)}</span>
                      <span className="text-sm text-primary">צפה ←</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">שם</th>
                      <th className="p-2">אימייל</th>
                      <th className="p-2">טלפון</th>
                      <th className="p-2">סוג</th>
                      <th className="p-2">נוסף ב</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          <Link href={`/clients/${c.id}`} className="hover:underline">
                            {c.name}
                          </Link>
                        </td>
                        <td className="p-2 text-muted-foreground">{c.email || "—"}</td>
                        <td className="p-2 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="p-2">{getTypeLabel(c.client_type)}</td>
                        <td className="p-2 text-muted-foreground">{formatDate(c.created_at)}</td>
                        <td className="p-2">
                          <Link href={`/clients/${c.id}/edit`}>
                            <Button variant="ghost" size="sm">ערוך</Button>
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
