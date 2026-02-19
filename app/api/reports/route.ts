import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "income";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const clientId = searchParams.get("client_id") || "";

    if (type === "income") {
      const fromDate = from || format(startOfYear(new Date()), "yyyy-MM-dd");
      const toDate = to || format(endOfYear(new Date()), "yyyy-MM-dd");
      const rangeStart = new Date(fromDate);
      const rangeEnd = new Date(`${toDate}T23:59:59.999`);

      const { data: allPaid, error } = await supabase
        .from("invoices")
        .select(`
          id, invoice_number, total, type, payment_status, created_at, paid_at, updated_at,
          clients ( id, name )
        `)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (allPaid || []).filter((inv) => {
        const effectiveDate = inv.paid_at ? new Date(inv.paid_at) : new Date(inv.updated_at || 0);
        return effectiveDate >= rangeStart && effectiveDate <= rangeEnd;
      });

      let totalIncome = 0;
      for (const inv of list) {
        const amt = Number(inv.total) || 0;
        if (inv.type === "credit") totalIncome -= amt;
        else totalIncome += amt;
      }

      return NextResponse.json({
        success: true,
        data: { invoices: list, totalIncome },
      });
    }

    if (type === "summary") {
      const y = year ? parseInt(year, 10) : new Date().getFullYear();
      const m = month ? parseInt(month, 10) : null;
      const rangeStart = m
        ? startOfMonth(new Date(y, m - 1))
        : startOfYear(new Date(y, 0));
      const rangeEnd = m
        ? endOfMonth(new Date(y, m - 1))
        : endOfYear(new Date(y, 11));

      const { data: allPaid, error } = await supabase
        .from("invoices")
        .select(`
          id, invoice_number, total, type, payment_status, created_at, paid_at, updated_at,
          clients ( id, name )
        `)
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const invoices = (allPaid || []).filter((inv) => {
        const effectiveDate = inv.paid_at ? new Date(inv.paid_at) : new Date(inv.updated_at || 0);
        return effectiveDate >= rangeStart && effectiveDate <= rangeEnd;
      });

      let income = 0;
      let credits = 0;
      for (const inv of invoices) {
        const amt = Number(inv.total) || 0;
        if (inv.type === "credit") credits += amt;
        else income += amt;
      }
      const netIncome = income - credits;

      const fromStr = format(rangeStart, "yyyy-MM-dd");
      const toStr = format(rangeEnd, "yyyy-MM-dd");

      const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", fromStr)
        .lte("date", toStr);

      const totalExpenses = (expensesData || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const profit = netIncome - totalExpenses;

      const periodLabel = m ? `חודש ${m}/${y}` : `שנת ${y}`;

      return NextResponse.json({
        success: true,
        data: {
          period: periodLabel,
          periodKey: m ? `${y}-${String(m).padStart(2, "0")}` : String(y),
          income,
          credits,
          netIncome,
          totalExpenses,
          profit,
          invoiceCount: invoices.length,
          paidInvoiceCount: invoices.length,
          invoices,
        },
      });
    }

    if (type === "debtors") {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id, invoice_number, total, due_date, created_at,
          clients ( id, name, email, phone )
        `)
        .eq("user_id", user.id)
        .in("payment_status", ["pending", "partially_paid"])
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      const total = (data || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
      return NextResponse.json({
        success: true,
        data: { invoices: data || [], totalPending: total },
      });
    }

    if (type === "clients") {
      if (clientId) {
        const { data: client } = await supabase
          .from("clients")
          .select("id, name")
          .eq("id", clientId)
          .eq("user_id", user.id)
          .single();

        const { data: invoices } = await supabase
          .from("invoices")
          .select(`
            id, invoice_number, total, type, payment_status, created_at, paid_at,
            clients ( id, name )
          `)
          .eq("user_id", user.id)
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });

        const { data: quotes } = await supabase
          .from("quotes")
          .select(`
            id, quote_number, total, status, created_at,
            clients ( id, name )
          `)
          .eq("user_id", user.id)
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });

        let totalInvoices = 0;
        for (const inv of invoices || []) {
          const amt = Number(inv.total) || 0;
          if (inv.type === "credit") totalInvoices -= amt;
          else totalInvoices += amt;
        }

        return NextResponse.json({
          success: true,
          data: {
            client: client || { name: "ללא לקוח" },
            invoices: invoices || [],
            quotes: quotes || [],
            totalInvoices,
            totalQuotes: (quotes || []).reduce((s, q) => s + (Number(q.total) || 0), 0),
          },
        });
      }

      const { data: clients, error: clientsErr } = await supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (clientsErr) throw clientsErr;

      const { data: invoices } = await supabase
        .from("invoices")
        .select("client_id, total, type, payment_status")
        .eq("user_id", user.id);

      const byClient: Record<string, { name: string; total: number; count: number }> = {};
      for (const c of clients || []) {
        byClient[c.id] = { name: c.name, total: 0, count: 0 };
      }
      byClient["__none__"] = { name: "ללא לקוח", total: 0, count: 0 };

      for (const inv of invoices || []) {
        const key = inv.client_id || "__none__";
        if (!byClient[key]) byClient[key] = { name: "ללא לקוח", total: 0, count: 0 };
        const amt = Number(inv.total) || 0;
        if (inv.type === "credit") byClient[key].total -= amt;
        else byClient[key].total += amt;
        byClient[key].count += 1;
      }

      const list = Object.entries(byClient)
        .filter(([, v]) => v.count > 0)
        .map(([id, v]) => ({ client_id: id === "__none__" ? null : id, ...v }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json({ success: true, data: list });
    }

    if (type === "quotes") {
      const { data: quotes, error } = await supabase
        .from("quotes")
        .select(`
          id, quote_number, total, status, created_at,
          clients ( id, name )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const byStatus: Record<string, number> = {
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
      };
      let totalValue = 0;
      for (const q of quotes || []) {
        byStatus[q.status] = (byStatus[q.status] || 0) + 1;
        totalValue += Number(q.total) || 0;
      }

      return NextResponse.json({
        success: true,
        data: {
          quotes: quotes || [],
          byStatus,
          totalQuotes: (quotes || []).length,
          totalValue,
        },
      });
    }

    return NextResponse.json({ error: "סוג דוח לא תקין" }, { status: 400 });
  } catch (err) {
    console.error("Reports error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה" },
      { status: 500 }
    );
  }
}
