import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { itemSchema } from "@/lib/validations/item";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ success: true, data: [] });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: true, data: [] });
    }
    await ensureUserInPublic(supabase, user);

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";

    let query = supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching items:", error);
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
      return NextResponse.json(
        { error: "משתני סביבה לא מוגדרים" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const body = await request.json();
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "קלט לא תקין", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from("items")
      .insert({
        user_id: user.id,
        name: parsed.data.name.trim(),
        description: parsed.data.description ?? null,
        price: parsed.data.price,
        currency: parsed.data.currency ?? "ILS",
        is_active: parsed.data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating item:", error);
      return NextResponse.json({ error: "שגיאה ביצירת הפריט" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה בשרת" },
      { status: 500 }
    );
  }
}
