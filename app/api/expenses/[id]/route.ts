import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { expenseSchema } from "@/lib/validations/expense";

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

    const { data: expense, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !expense) {
      return NextResponse.json({ error: "הוצאה לא נמצאה" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: expense });
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

    const body = await request.json();
    const parsed = expenseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "קלט לא תקין", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.amount !== undefined) updates.amount = parsed.data.amount;
    if (parsed.data.date !== undefined) updates.date = parsed.data.date;
    if (parsed.data.category !== undefined) updates.category = parsed.data.category;
    if (parsed.data.supplier !== undefined) updates.supplier = parsed.data.supplier ?? null;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
    if (parsed.data.receipt_reference !== undefined) updates.receipt_reference = parsed.data.receipt_reference ?? null;
    if (parsed.data.attachment_url !== undefined) updates.attachment_url = parsed.data.attachment_url ?? null;
    if (parsed.data.vat_included !== undefined) updates.vat_included = parsed.data.vat_included;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes ?? null;

    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      return NextResponse.json({ error: "שגיאה בעדכון ההוצאה" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: expense });
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
    await ensureUserInPublic(supabase, user);

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting expense:", error);
      return NextResponse.json({ error: "שגיאה במחיקת ההוצאה" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
