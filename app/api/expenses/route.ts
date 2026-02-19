import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { expenseSchema } from "@/lib/validations/expense";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const category = searchParams.get("category");

    let query = supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (year) {
      const y = parseInt(year, 10);
      if (!isNaN(y)) {
        query = query.gte("date", `${y}-01-01`).lte("date", `${y}-12-31`);
      }
    }
    if (month) {
      const m = parseInt(month, 10);
      if (!isNaN(m) && year) {
        const y = parseInt(year, 10);
        const pad = (n: number) => String(n).padStart(2, "0");
        query = query
          .gte("date", `${y}-${pad(m)}-01`)
          .lte("date", `${y}-${pad(m)}-31`);
      }
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      return NextResponse.json({ error: "שגיאה בטעינת ההוצאות" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: expenses || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
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
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "קלט לא תקין", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        amount: parsed.data.amount,
        date: parsed.data.date,
        category: parsed.data.category,
        supplier: parsed.data.supplier ?? null,
        description: parsed.data.description ?? null,
        receipt_reference: parsed.data.receipt_reference ?? null,
        attachment_url: parsed.data.attachment_url ?? null,
        vat_included: parsed.data.vat_included ?? true,
        notes: parsed.data.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return NextResponse.json({ error: "שגיאה ביצירת ההוצאה" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
