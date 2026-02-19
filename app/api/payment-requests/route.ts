import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { createPaymentRequestSchema } from "@/lib/validations/payment-request";
import { PAYMENT_REQUEST_PREFIX } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: true, data: [] });
    }
    await ensureUserInPublic(supabase, user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    let query = supabase
      .from("payment_requests")
      .select(`
        *,
        clients ( id, name, email, phone )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && ["draft", "sent", "paid", "converted", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching payment requests:", error);
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const body = await request.json();
    const parsed = createPaymentRequestSchema.safeParse(body);
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

    const { data: userData } = await supabase.from("users").select("settings").eq("id", user.id).single();
    const prefix = (userData?.settings as { payment_request_prefix?: string })?.payment_request_prefix || PAYMENT_REQUEST_PREFIX;
    const year = new Date().getFullYear();

    const { data: lastReq } = await supabase
      .from("payment_requests")
      .select("request_number")
      .eq("user_id", user.id)
      .like("request_number", `${prefix}-${year}-%`)
      .order("request_number", { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastReq) {
      const lastNum = parseInt(lastReq.request_number.split("-").pop() || "0");
      sequence = lastNum + 1;
    }
    const requestNumber = `${prefix}-${year}-${sequence.toString().padStart(3, "0")}`;

    const { data: pr, error } = await supabase
      .from("payment_requests")
      .insert({
        user_id: user.id,
        client_id: parsed.data.client_id ?? null,
        request_number: requestNumber,
        items,
        subtotal,
        total,
        status: "draft",
        due_date: parsed.data.due_date || null,
        notes: parsed.data.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment request:", error);
      const msg =
        error.code === "42P01"
          ? "טבלת דרישות תשלום לא קיימת – הרץ את המיגרציה ב-Supabase (supabase/migrations/20250204_add_payment_requests.sql)"
          : "שגיאה ביצירת דרישת התשלום";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: pr }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה" },
      { status: 500 }
    );
  }
}
