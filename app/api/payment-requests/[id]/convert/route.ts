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

    const { data: pr, error: fetchError } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !pr) {
      return NextResponse.json({ error: "דרישת תשלום לא נמצאה" }, { status: 404 });
    }

    if (pr.status === "converted") {
      return NextResponse.json(
        { error: "דרישה זו כבר הומרה לחשבונית" },
        { status: 400 }
      );
    }

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

    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: pr.client_id,
        invoice_number: invoiceNumber,
        type: "invoice",
        items: pr.items,
        subtotal: pr.subtotal,
        total: pr.total,
        payment_status: "pending",
        notes: pr.notes ? `הומר מדרישת תשלום ${pr.request_number}\n\n${pr.notes}` : `הומר מדרישת תשלום ${pr.request_number}`,
      })
      .select()
      .single();

    if (invError) {
      console.error("Error creating invoice:", invError);
      return NextResponse.json({ error: "שגיאה ביצירת החשבונית" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("payment_requests")
      .update({
        status: "converted",
        converted_invoice_id: invoice.id,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating payment request:", updateError);
    }

    return NextResponse.json({
      success: true,
      data: { invoice, payment_request_id: id },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה" },
      { status: 500 }
    );
  }
}
