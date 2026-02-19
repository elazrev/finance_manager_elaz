import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { clientSchema } from "@/lib/validations/client";

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
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || ""; // casual | regular

    let query = supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (type && (type === "casual" || type === "regular")) {
      query = query.eq("client_type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching clients:", error);
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
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "קלט לא תקין", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        name: parsed.data.name.trim(),
        contact_person: parsed.data.contact_person ?? null,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        address: parsed.data.address ?? null,
        identity_number: parsed.data.identity_number ?? null,
        client_type: parsed.data.client_type ?? "casual",
        notes: parsed.data.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return NextResponse.json({ error: "שגיאה ביצירת הלקוח" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || "שגיאה בשרת" }, { status: 500 });
  }
}
