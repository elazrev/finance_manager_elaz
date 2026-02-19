import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { createQuoteSchema } from "@/lib/validations/quote";

export async function POST(request: NextRequest) {
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
    await ensureUserInPublic(supabase, user);

    // Validate input
    const body = await request.json();
    const validatedData = createQuoteSchema.parse(body);

    // Calculate totals
    const items = validatedData.items.map((item) => {
      const discountAmount = (item.discount || 0) / 100;
      const total = item.quantity * item.unit_price * (1 - discountAmount);
      return {
        ...item,
        total: Math.round(total * 100) / 100,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = Math.round(subtotal * 100) / 100;

    // Get user settings for quote prefix
    const { data: userData } = await supabase
      .from("users")
      .select("settings")
      .eq("id", user.id)
      .single();

    const prefix = userData?.settings?.quote_prefix || "QUO";
    const year = new Date().getFullYear();

    // Get last quote number for this user
    const { data: lastQuote } = await supabase
      .from("quotes")
      .select("quote_number")
      .eq("user_id", user.id)
      .like("quote_number", `${prefix}-${year}-%`)
      .order("quote_number", { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastQuote) {
      const lastNumber = parseInt(
        lastQuote.quote_number.split("-").pop() || "0"
      );
      sequence = lastNumber + 1;
    }

    const quoteNumber = `${prefix}-${year}-${sequence.toString().padStart(3, "0")}`;

    let clientId: string | null = validatedData.client_id || null;

    if (!clientId && validatedData.client_name) {
      const name = validatedData.client_name.trim();
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", name)
        .limit(1)
        .single();
      if (existing?.id) {
        clientId = existing.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            name,
            client_type: "casual",
          })
          .select("id")
          .single();
        if (!clientErr && newClient?.id) clientId = newClient.id;
      }
    }

    // Create quote
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        user_id: user.id,
        client_id: clientId,
        quote_number: quoteNumber,
        status: "draft",
        items: items,
        subtotal: subtotal,
        total: total,
        valid_until: validatedData.valid_until || null,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating quote:", error);
      return NextResponse.json(
        { error: "שגיאה ביצירת הצעה" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: quote,
        message: "הצעה נוצרה בהצלחה",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Quote creation error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "קלט לא תקין",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // More detailed error message
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

export async function GET(request: NextRequest) {
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

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Return empty array instead of error for better UX
      // In production, you might want to redirect to login
      return NextResponse.json({
        success: true,
        data: [],
        message: "יש להתחבר כדי לראות הצעות",
      });
    }
    await ensureUserInPublic(supabase, user);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id") || "";

    let query = supabase
      .from("quotes")
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: quotes, error } = await query;

    if (error) {
      console.error("Error fetching quotes:", error);
      // Return empty array instead of error to prevent crash
      return NextResponse.json({
        success: true,
        data: [],
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      data: quotes || [],
    });
  } catch (error: any) {
    console.error("Error:", error);
    // Return empty array instead of error to prevent crash
    return NextResponse.json({
      success: true,
      data: [],
      error: error?.message || "שגיאה לא ידועה",
    });
  }
}
