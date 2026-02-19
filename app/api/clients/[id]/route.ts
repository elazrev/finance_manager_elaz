import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validations/client";

export async function GET(
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

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
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
      .update({
        name: parsed.data.name.trim(),
        contact_person: parsed.data.contact_person ?? null,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        address: parsed.data.address ?? null,
        identity_number: parsed.data.identity_number ?? null,
        client_type: parsed.data.client_type ?? "casual",
        notes: parsed.data.notes ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating client:", error);
      return NextResponse.json({ error: "שגיאה בעדכון הלקוח" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || "שגיאה בשרת" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting client:", error);
      return NextResponse.json({ error: "שגיאה במחיקת הלקוח" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
