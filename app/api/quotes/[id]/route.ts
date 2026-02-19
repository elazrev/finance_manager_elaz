import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createQuoteSchema } from "@/lib/validations/quote";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { 
          error: "משתני סביבה לא מוגדרים",
          details: "אנא ודא שקובץ .env.local קיים ומכיל את NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY"
        },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "לא מאושר" },
        { status: 401 }
      );
    }

    // Get quote
    const { data: quote, error } = await supabase
      .from("quotes")
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching quote:", error);
      return NextResponse.json(
        { error: "שגיאה בטעינת הצעה" },
        { status: 500 }
      );
    }

    if (!quote) {
      return NextResponse.json(
        { error: "הצעה לא נמצאה" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error("Error:", error);
    const errorMessage = error.message || "שגיאה לא ידועה";
    return NextResponse.json(
      { 
        error: "שגיאה בשרת",
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createQuoteSchema.safeParse(body);
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

    const { data: quote, error } = await supabase
      .from("quotes")
      .update({
        client_id: parsed.data.client_id ?? null,
        items,
        subtotal,
        total,
        valid_until: parsed.data.valid_until || null,
        notes: parsed.data.notes ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quote:", error);
      return NextResponse.json({ error: "שגיאה בעדכון" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: quote });
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }

    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting quote:", error);
      return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error?.message || "שגיאה בשרת" },
      { status: 500 }
    );
  }
}
