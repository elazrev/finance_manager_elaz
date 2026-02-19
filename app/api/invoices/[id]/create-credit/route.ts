import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";

export async function POST(
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

    const { data: original, error: fetchErr } = await supabase
      .from("invoices")
      .select("*, clients(id, name, email, phone, address, identity_number)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !original) {
      return NextResponse.json({ error: "חשבונית לא נמצאה" }, { status: 404 });
    }

    if (original.payment_status !== "paid") {
      return NextResponse.json(
        { error: "חשבונית ביטול נוצרת רק עבור חשבונית ששולמה במלואה" },
        { status: 400 }
      );
    }
    if (original.type === "credit") {
      return NextResponse.json(
        { error: "לא ניתן ליצור ביטול לחשבונית זיכוי" },
        { status: 400 }
      );
    }

    type InvoiceItem = { description?: string; quantity?: number; unit_price?: number; discount?: number; total?: number };
    const items = ((original.items as InvoiceItem[]) || []).map((item) => {
      const itemTotal = Math.abs(Number(item.total) || 0);
      return {
        description: item.description || "",
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        discount: item.discount ?? 0,
        total: Math.round(itemTotal * 100) / 100,
      };
    });
    const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
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
      const lastNum = parseInt((lastInv.invoice_number as string).split("-").pop() || "0");
      sequence = lastNum + 1;
    }
    const invoiceNumber = `${prefix}-${year}-${sequence.toString().padStart(3, "0")}`;

    const { data: creditInvoice, error: insertErr } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: original.client_id,
        invoice_number: invoiceNumber,
        type: "credit",
        items,
        subtotal,
        total,
        payment_status: "paid",
        paid_at: original.paid_at ?? new Date().toISOString(),
        notes: `חשבונית ביטול – מקור: ${original.invoice_number}`,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Error creating credit invoice:", insertErr);
      return NextResponse.json({ error: "שגיאה ביצירת חשבונית הביטול" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: creditInvoice }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
