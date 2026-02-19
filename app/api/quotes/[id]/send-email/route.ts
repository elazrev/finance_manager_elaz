import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInPublic } from "@/lib/supabase/ensure-user";
import { Resend } from "resend";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DOCUMENT_DISCLAIMER } from "@/lib/constants";
import type { UserSettings } from "@/types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!resend) {
      return NextResponse.json(
        { error: "שליחת אימייל לא מוגדרת. הוסף RESEND_API_KEY ל-.env.local" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "לא מאושר" }, { status: 401 });
    }
    await ensureUserInPublic(supabase, user);

    const { data: userRow } = await supabase
      .from("users")
      .select("business_name, email, settings")
      .eq("id", user.id)
      .single();

    const { data: quote, error } = await supabase
      .from("quotes")
      .select(`
        *,
        clients ( name, email )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: "הצעה לא נמצאה" }, { status: 404 });
    }

    const clientEmail = (quote.clients as { email?: string } | null)?.email;
    if (!clientEmail) {
      return NextResponse.json(
        { error: "ללקוח אין כתובת אימייל" },
        { status: 400 }
      );
    }

    const businessName = userRow?.business_name || userRow?.email || "העסק";
    const items = (quote.items || []) as Array<{
      description?: string;
      quantity?: number;
      unit_price?: number;
      discount?: number;
      total?: number;
    }>;
    const total = Number(quote.total) || 0;

    const itemsRows = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.description || ""}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity ?? 1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:left">${formatCurrency(item.unit_price ?? 0)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:left">${formatCurrency(item.total ?? 0)}</td>
          </tr>`
      )
      .join("");

    const logoUrl = (userRow?.settings as UserSettings)?.logo_url;
    const signatureUrl = (userRow?.settings as UserSettings)?.signature_url;
    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;direction:rtl">
  ${logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${logoUrl}" alt="לוגו" style="height:48px;object-fit:contain" /></div>` : ""}
  <h2 style="margin-bottom:8px">הצעת מחיר ${quote.quote_number}</h2>
  <p style="color:#666;margin-bottom:24px">מ${businessName} • תאריך: ${formatDate(quote.created_at)}</p>
  ${quote.valid_until ? `<p style="color:#666;margin-bottom:16px">תוקף עד: ${formatDate(quote.valid_until)}</p>` : ""}
  
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px;text-align:right">תיאור</th>
        <th style="padding:8px;text-align:center">כמות</th>
        <th style="padding:8px;text-align:left">מחיר</th>
        <th style="padding:8px;text-align:left">סה"כ</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>
  
  <p style="font-size:18px;font-weight:bold;margin-top:16px">סה"כ לתשלום: ${formatCurrency(total)}</p>
  
  <p style="margin-top:32px;color:#666;font-size:14px">עוסק פטור - המחיר פטור ממע"מ</p>
  <p style="margin-top:24px;color:#999;font-size:11px">${(() => {
    const f = (userRow?.settings as UserSettings)?.document_footer;
    return f === undefined ? DOCUMENT_DISCLAIMER : (f || "");
  })()}</p>
  ${signatureUrl ? `<p style="margin-top:24px;text-align:right"><img src="${signatureUrl}" alt="חתימה" style="height:40px;object-fit:contain;max-width:150px" /></p>` : ""}
  <p style="margin-top:16px;color:#666;font-size:14px">בברכה,<br>${businessName}</p>
</body>
</html>`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const { error: sendError } = await resend.emails.send({
      from: `${businessName} <${fromEmail}>`,
      to: clientEmail,
      subject: `הצעת מחיר ${quote.quote_number} - ${formatCurrency(total)}`,
      html,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return NextResponse.json(
        { error: sendError.message || "שגיאה בשליחת האימייל" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "האימייל נשלח בהצלחה" });
  } catch (err) {
    console.error("Send quote email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה" },
      { status: 500 }
    );
  }
}
