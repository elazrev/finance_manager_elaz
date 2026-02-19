import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { createPaymentRequestSchema } from "@/lib/validations/payment-request";
import { PAYMENT_REQUEST_PREFIX } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }

    const { data: pr, error } = await supabase
      .from("payment_requests")
      .select(`
        *,
        clients ( id, name, email, phone, address, identity_number )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !pr) {
      return NextResponse.json({ error: "דרישת תשלום לא נמצאה" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pr });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }

    const existing = await supabase
      .from("payment_requests")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existing.data?.status === "converted") {
      return NextResponse.json(
        { error: "לא ניתן לערוך דרישת תשלום שכבר הומרה לחשבונית" },
        { status: 400 }
      );
    }

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

    const { data: pr, error } = await supabase
      .from("payment_requests")
      .update({
        client_id: parsed.data.client_id ?? null,
        items,
        subtotal,
        total,
        due_date: parsed.data.due_date || null,
        notes: parsed.data.notes ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment request:", error);
      return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: pr });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }

    const { error } = await supabase
      .from("payment_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting payment request:", error);
      return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
