import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { createInvoiceSchema } from "@/lib/validations/invoice";

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
    await ensureUserInPublic(supabase, user);

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          address,
          identity_number
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "חשבונית לא נמצאה" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
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
    await ensureUserInPublic(supabase, user);

    const { data: existing } = await supabase
      .from("invoices")
      .select("payment_status, type")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existing?.payment_status === "paid") {
      return NextResponse.json(
        { error: "לא ניתן לערוך חשבונית ששולמה במלואה. לביטול – השתמש ב'צור חשבונית ביטול'" },
        { status: 403 }
      );
    }
    if (existing?.type === "credit") {
      return NextResponse.json(
        { error: "לא ניתן לערוך חשבונית זיכוי" },
        { status: 403 }
      );
    }

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

    const isPaid = parsed.data.payment_status === "paid";
    const paidAt = isPaid
      ? (parsed.data.paid_at ? new Date(parsed.data.paid_at).toISOString() : new Date().toISOString())
      : null;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update({
        client_id: parsed.data.client_id ?? null,
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
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice:", error);
      return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
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

    const { data: invoice } = await supabase
      .from("invoices")
      .select("payment_status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (invoice && ["paid", "partially_paid"].includes(invoice.payment_status ?? "")) {
      return NextResponse.json(
        { error: "לא ניתן למחוק חשבונית שבוצע עליה תשלום – היא נכנסת למחזור הכספים" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting invoice:", error);
      return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
