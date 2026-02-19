import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { createInvoiceSchema } from "@/lib/validations/invoice";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ success: true, data: [] });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: true, data: [], message: "יש להתחבר כדי לראות חשבוניות" });
    }
    await ensureUserInPublic(supabase, user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const clientId = searchParams.get("client_id") || "";

    let query = supabase
      .from("invoices")
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && ["pending", "partially_paid", "paid", "cancelled"].includes(status)) {
      query = query.eq("payment_status", status);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invoices:", error);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "משתני סביבה לא מוגדרים" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "קלט לא תקין", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items = parsed.data.items.map((item) => {
      const discountAmount = (item.discount || 0) / 100;
      const total = item.quantity * item.unit_price * (1 - discountAmount);
      return { ...item, total: Math.round(total * 100) / 100 };
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = Math.round(subtotal * 100) / 100;

    const { data: userData } = await supabase
      .from("users")
      .select("settings")
      .eq("id", user.id)
      .single();

    const prefix = (userData?.settings as { invoice_prefix?: string })?.invoice_prefix || "INV";
    const year = new Date().getFullYear();

    const { data: lastInv } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", user.id)
      .like("invoice_number", `${prefix}-${year}-%`)
      .order("invoice_number", { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastInv) {
      const lastNum = parseInt(lastInv.invoice_number.split("-").pop() || "0");
      sequence = lastNum + 1;
    }
    const invoiceNumber = `${prefix}-${year}-${sequence.toString().padStart(3, "0")}`;

    const isPaid = parsed.data.payment_status === "paid";
    const paidAt = isPaid
      ? (parsed.data.paid_at ? new Date(parsed.data.paid_at).toISOString() : new Date().toISOString())
      : null;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: parsed.data.client_id ?? null,
        invoice_number: invoiceNumber,
        type: parsed.data.type ?? "invoice",
        items,
        subtotal,
        total,
        payment_method: parsed.data.payment_method ?? null,
        payment_status: parsed.data.payment_status ?? "pending",
        paid_at: paidAt,
        due_date: parsed.data.due_date || null,
        notes: parsed.data.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      return NextResponse.json({ error: "שגיאה ביצירת החשבונית" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "שגיאה בשרת",
    }, { status: 500 });
  }
}
