import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();
    const monthEnd = endOfMonth(now).toISOString();

    const [clientsRes, invoicesRes, quotesRes, paymentRequestsRes, monthlyPendingInvoicesRes, monthlyPaymentRequestsRes, monthlyQuotesRes, monthlyPaidInvoicesRes, monthlyExpensesRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("invoices")
        .select("id, total, type")
        .eq("user_id", user.id)
        .eq("payment_status", "pending"),
      supabase
        .from("quotes")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["draft", "sent"]),
      supabase
        .from("payment_requests")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["draft", "sent"]),
      supabase
        .from("invoices")
        .select("total")
        .eq("user_id", user.id)
        .in("payment_status", ["pending", "partially_paid"])
        .neq("type", "credit")
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd),
      supabase
        .from("payment_requests")
        .select("total")
        .eq("user_id", user.id)
        .in("status", ["draft", "sent"])
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd),
      supabase
        .from("quotes")
        .select("total")
        .eq("user_id", user.id)
        .in("status", ["draft", "sent"])
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd),
      supabase
        .from("invoices")
        .select("total, type, payment_status, paid_at, updated_at")
        .eq("user_id", user.id)
        .eq("payment_status", "paid"),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", format(startOfMonth(now), "yyyy-MM-dd"))
        .lte("date", format(endOfMonth(now), "yyyy-MM-dd")),
    ]);

    const clientsCount = clientsRes.count ?? 0;
    const pendingInvoicesCount = invoicesRes.data?.length ?? 0;
    const activeQuotesCount = quotesRes.data?.length ?? 0;
    const pendingPaymentRequestsCount = paymentRequestsRes.data?.length ?? 0;

    let monthlyPendingInvoicesTotal = 0;
    for (const inv of monthlyPendingInvoicesRes.data || []) {
      monthlyPendingInvoicesTotal += Number(inv.total) || 0;
    }

    let monthlyPaymentRequestsTotal = 0;
    for (const pr of monthlyPaymentRequestsRes.data || []) {
      monthlyPaymentRequestsTotal += Number(pr.total) || 0;
    }

    let monthlyQuotesTotal = 0;
    for (const q of monthlyQuotesRes.data || []) {
      monthlyQuotesTotal += Number(q.total) || 0;
    }

    const monthlyExpenses = (monthlyExpensesRes.data || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);

    let monthlyActualIncome = 0;
    for (const inv of monthlyPaidInvoicesRes.data || []) {
      const effectiveDate = inv.paid_at ? new Date(inv.paid_at) : new Date(inv.updated_at || 0);
      const effectiveMonth = format(effectiveDate, "yyyy-MM");
      const currentMonthKey = format(now, "yyyy-MM");
      if (effectiveMonth !== currentMonthKey) continue;
      const total = Number(inv.total) || 0;
      if (inv.type === "credit") {
        monthlyActualIncome -= total;
      } else {
        monthlyActualIncome += total;
      }
    }

    const recentInvoices = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total,
        payment_status,
        created_at,
        clients ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentQuotes = await supabase
      .from("quotes")
      .select(`
        id,
        quote_number,
        total,
        status,
        created_at,
        clients ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentPaymentRequests = await supabase
      .from("payment_requests")
      .select(`
        id,
        request_number,
        total,
        status,
        created_at,
        clients ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: clientsList } = await supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id);

    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("client_id")
      .eq("user_id", user.id);

    const { data: allQuotes } = await supabase
      .from("quotes")
      .select("client_id")
      .eq("user_id", user.id);

    const { data: allPaymentRequests } = await supabase
      .from("payment_requests")
      .select("client_id")
      .eq("user_id", user.id);

    const docCountByClient: Record<string, number> = {};
    for (const c of clientsList || []) {
      docCountByClient[c.id] = 0;
    }
    docCountByClient["__none__"] = 0;

    for (const inv of allInvoices || []) {
      const key = inv.client_id || "__none__";
      docCountByClient[key] = (docCountByClient[key] ?? 0) + 1;
    }
    for (const q of allQuotes || []) {
      const key = q.client_id || "__none__";
      docCountByClient[key] = (docCountByClient[key] ?? 0) + 1;
    }
    for (const pr of allPaymentRequests || []) {
      const key = pr.client_id || "__none__";
      docCountByClient[key] = (docCountByClient[key] ?? 0) + 1;
    }

    const topClients = Object.entries(docCountByClient)
      .filter(([k]) => k !== "__none__")
      .map(([id, count]) => ({
        id,
        name: clientsList?.find((c) => c.id === id)?.name ?? "ללא שם",
        docCount: count,
      }))
      .sort((a, b) => b.docCount - a.docCount)
      .slice(0, 3);

    const { data: histInvoices } = await supabase
      .from("invoices")
      .select("total, type, payment_status, paid_at, updated_at")
      .eq("user_id", user.id)
      .eq("payment_status", "paid");

    const monthlyData: Array<{ month: string; income: number; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthKey = format(d, "yyyy-MM");
      const hebrewMonths = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יוני", "יולי", "אוג", "ספט", "אוק", "נוב", "דצמ"];
      monthlyData.push({
        month: monthKey,
        income: 0,
        label: `${hebrewMonths[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    for (const inv of histInvoices || []) {
      if (inv.payment_status !== "paid") continue;
      const effectiveDate = inv.paid_at ? new Date(inv.paid_at) : new Date(inv.updated_at || 0);
      const monthKey = format(effectiveDate, "yyyy-MM");
      const entry = monthlyData.find((m) => m.month === monthKey);
      if (!entry) continue;
      const amt = Number(inv.total) || 0;
      if (inv.type === "credit") entry.income -= amt;
      else entry.income += amt;
    }

    return NextResponse.json({
      success: true,
      data: {
        clientsCount,
        pendingInvoicesCount,
        activeQuotesCount,
        pendingPaymentRequestsCount,
        monthlyPendingInvoicesTotal,
        monthlyPaymentRequestsTotal,
        monthlyQuotesTotal,
        monthlyActualIncome: monthlyActualIncome,
        monthlyExpenses,
        topClients,
        recentInvoices: recentInvoices.data || [],
        recentQuotes: recentQuotes.data || [],
        recentPaymentRequests: recentPaymentRequests.data || [],
        incomeByMonth: monthlyData,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה" },
      { status: 500 }
    );
  }
}
