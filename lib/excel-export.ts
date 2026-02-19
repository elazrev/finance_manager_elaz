import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "./formatters";

type ReportType = "income" | "summary" | "debtors" | "clients" | "quotes";

function getSheetName(type: ReportType): string {
  const names: Record<ReportType, string> = {
    income: "ספר הכנסות",
    summary: "דוח חודשי",
    debtors: "דוח חייבים",
    clients: "דוח לקוחות",
    quotes: "דוח הצעות",
  };
  return names[type];
}

export function exportReportToExcel(
  type: ReportType,
  data: unknown,
  params?: { from?: string; to?: string; year?: string; month?: string; clientId?: string }
) {
  const wb = XLSX.utils.book_new();
  const fileName = `חשבונות_${getSheetName(type)}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (type === "income" && data && typeof data === "object" && "invoices" in data) {
    const d = data as { totalIncome?: number; invoices?: Array<Record<string, unknown>> };
    const rows: (string | number)[][] = [
      ["ספר הכנסות", params?.from ? `מתאריך: ${params.from}` : "", params?.to ? `עד תאריך: ${params.to}` : ""],
      ["סה\"כ הכנסות:", formatCurrency((d.totalIncome as number) ?? 0)],
      [],
      ["מס' חשבונית", "לקוח", "תאריך תשלום", "סכום"],
    ];
    for (const inv of d.invoices || []) {
      const total = Number(inv.total) || 0;
      rows.push([
        String(inv.invoice_number ?? ""),
        String((inv.clients as { name?: string })?.name ?? "ללא לקוח"),
        (inv.paid_at || inv.created_at) ? formatDate(String(inv.paid_at || inv.created_at)) : "",
        inv.type === "credit" ? -total : total,
      ]);
    }
    rows.push([], ["סה\"כ", "", "", (d.totalIncome as number) ?? 0]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, getSheetName(type));
  } else if (type === "summary" && data && typeof data === "object") {
    const d = data as {
      period?: string;
      income?: number;
      credits?: number;
      netIncome?: number;
      totalExpenses?: number;
      profit?: number;
      invoiceCount?: number;
      invoices?: Array<Record<string, unknown>>;
    };
    const rows: (string | number)[][] = [
      ["דוח חודשי/שנתי", params?.year ?? "", params?.month ? `חודש ${params.month}` : "כל השנה"],
      [],
      ["תקופה", d.period ?? ""],
      ["הכנסות (חשבוניות ששולמו)", formatCurrency(d.income ?? 0)],
      ["זיכויים", formatCurrency(d.credits ?? 0)],
      ["סה\"כ הכנסות נטו", formatCurrency(d.netIncome ?? 0)],
      ["הוצאות", formatCurrency(d.totalExpenses ?? 0)],
      ["רווח (הכנסות − הוצאות)", formatCurrency(d.profit ?? (d.netIncome ?? 0))],
      ["מספר חשבוניות", d.invoiceCount ?? 0],
      [],
      ["מס' חשבונית", "לקוח", "תאריך תשלום", "סכום"],
    ];
    for (const inv of d.invoices || []) {
      const total = Number(inv.total) || 0;
      rows.push([
        String(inv.invoice_number ?? ""),
        String((inv.clients as { name?: string })?.name ?? "ללא לקוח"),
        (inv.paid_at || inv.created_at) ? formatDate(String(inv.paid_at || inv.created_at)) : "",
        inv.type === "credit" ? -total : total,
      ]);
    }
    rows.push([], ["סה\"כ נטו", "", "", d.netIncome ?? 0]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, getSheetName(type));
  } else if (type === "debtors" && data && typeof data === "object" && "invoices" in data) {
    const d = data as { totalPending?: number; invoices?: Array<Record<string, unknown>> };
    const rows: (string | number)[][] = [
      ["דוח חייבים"],
      ["סה\"כ ממתין:", formatCurrency((d.totalPending as number) ?? 0)],
      [],
      ["מס' חשבונית", "לקוח", "תאריך פירעון", "סכום"],
    ];
    for (const inv of d.invoices || []) {
      rows.push([
        String(inv.invoice_number ?? ""),
        String((inv.clients as { name?: string })?.name ?? "ללא לקוח"),
        inv.due_date ? formatDate(inv.due_date as string) : "",
        Number(inv.total) || 0,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, getSheetName(type));
  } else if (type === "clients") {
    if (params?.clientId && data && typeof data === "object" && "invoices" in (data as object)) {
      const d = data as {
        client?: { name?: string };
        invoices?: Array<Record<string, unknown>>;
        quotes?: Array<Record<string, unknown>>;
        totalInvoices?: number;
        totalQuotes?: number;
      };
      const rows: (string | number)[][] = [
        ["דוח לקוח", d.client?.name ?? ""],
        [],
        ["חשבוניות"],
        ["מס' חשבונית", "תאריך תשלום", "סכום"],
      ];
      for (const inv of d.invoices || []) {
        const total = Number(inv.total) || 0;
        rows.push([
          String(inv.invoice_number ?? ""),
          (inv.paid_at || inv.created_at) ? formatDate(String(inv.paid_at || inv.created_at)) : "",
          inv.type === "credit" ? -total : total,
        ]);
      }
      rows.push(["סה\"כ חשבוניות", "", d.totalInvoices ?? 0], []);
      rows.push(["הצעות מחיר"], ["מס' הצעה", "תאריך", "סכום"]);
      for (const q of d.quotes || []) {
        rows.push([
          String(q.quote_number ?? ""),
          q.created_at ? formatDate(q.created_at as string) : "",
          Number(q.total) ?? 0,
        ]);
      }
      rows.push(["סה\"כ הצעות", "", d.totalQuotes ?? 0]);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "דוח לקוח");
    } else if (Array.isArray(data)) {
      const rows: (string | number)[][] = [["לקוח", "מספר חשבוניות", "סה\"כ"]];
      for (const row of data as Array<{ name?: string; count?: number; total?: number }>) {
        rows.push([row.name ?? "", row.count ?? 0, Number(row.total) ?? 0]);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, getSheetName(type));
    }
  } else if (type === "quotes" && data && typeof data === "object" && "quotes" in data) {
    const d = data as {
      totalQuotes?: number;
      totalValue?: number;
      quotes?: Array<Record<string, unknown>>;
    };
    const rows: (string | number)[][] = [
      ["דוח הצעות"],
      ["סה\"כ הצעות:", d.totalQuotes ?? 0],
      ["ערך כולל:", formatCurrency((d.totalValue as number) ?? 0)],
      [],
      ["מס' הצעה", "לקוח", "סטטוס", "סכום"],
    ];
    for (const q of d.quotes || []) {
      rows.push([
        String(q.quote_number ?? ""),
        String((q.clients as { name?: string })?.name ?? "ללא לקוח"),
        String(q.status ?? ""),
        Number(q.total) ?? 0,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, getSheetName(type));
  } else {
    return;
  }

  XLSX.writeFile(wb, fileName);
}
