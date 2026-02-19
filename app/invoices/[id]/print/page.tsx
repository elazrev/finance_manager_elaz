"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DOCUMENT_DISCLAIMER, PAYMENT_METHODS } from "@/lib/constants";
import type { Invoice, InvoiceItem, UserSettings } from "@/types";

type InvoiceWithRelations = Invoice & {
  clients?: { name?: string; email?: string; phone?: string; address?: string; identity_number?: string };
};

export default function InvoicePrintPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("חשבונית לא נמצאה");
      const j = await res.json();
      return j.data as InvoiceWithRelations;
    },
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) return null;
      const j = await res.json();
      return j.data;
    },
  });

  if (isLoading || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" dir="rtl">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" dir="rtl">
        <p className="text-destructive">חשבונית לא נמצאה</p>
      </div>
    );
  }

  const items = (invoice.items || []) as InvoiceItem[];
  const client = invoice.clients;
  const businessName = user?.business_name || user?.email || "עסק";
  const businessDetailsItems = [
    user?.address,
    user?.phone,
    user?.email,
    user?.tax_id ? `ח.פ. ${user.tax_id}` : null,
  ].filter((x): x is string => Boolean(x));
  const issuerLayout = (user?.settings as UserSettings)?.issuer_details_layout || "row";

  const invoiceTypeLabel =
    invoice.type === "invoice" ? "חשבונית" : invoice.type === "receipt" ? "קבלה" : "חשבונית זיכוי";

  const showEditDate = (user?.settings as UserSettings)?.show_edit_date_on_documents ?? true;
  const wasEdited = invoice.updated_at && invoice.created_at && new Date(invoice.updated_at).getTime() - new Date(invoice.created_at).getTime() > 2000;

  return (
    <div className="print:min-h-0" dir="rtl">
      {/* כפתורים - מוסתרים בהדפסה */}
      <div className="fixed top-4 left-4 z-50 print:hidden flex items-center gap-2 sm:gap-4 bg-white/90 dark:bg-black/90 p-3 rounded-lg shadow-lg">
        <button
          onClick={() => window.print()}
          className="bg-primary text-primary-foreground px-4 py-3 min-h-[44px] rounded shadow hover:opacity-90 touch-manipulation text-sm font-medium"
        >
          הדפס / שמור כ-PDF
        </button>
        <a href={`/invoices/${id}`} className="text-sm text-muted-foreground hover:underline py-2 min-h-[44px] flex items-center touch-manipulation">
          ← חזור
        </a>
      </div>

      {/* תוכן החשבונית בלבד - נדפס */}
      <div className="max-w-3xl mx-auto py-4 px-2 sm:px-0 print:py-0 print:px-0 print:max-w-none">
        <div className="bg-white text-black text-[13px] sm:text-base print:text-sm">
          {/* לוגו במרכז העליון */}
          {(user?.settings as UserSettings)?.logo_url && (
            <div className="flex justify-center mb-3 sm:mb-4">
              <img
                src={(user?.settings as UserSettings).logo_url!}
                alt="לוגו"
                className="h-10 sm:h-14 object-contain"
              />
            </div>
          )}
          {/* כותרת */}
          <div className="flex justify-between items-start gap-4 sm:gap-8 mb-4 sm:mb-8 pb-3 sm:pb-4 border-b-2 border-black">
            <div className="text-right min-w-0">
              <h1 className="text-base sm:text-2xl font-bold leading-tight mb-1">{invoiceTypeLabel}</h1>
              <p className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2">{invoice.invoice_number}</p>
              <p className="text-xs sm:text-sm text-gray-700">{formatDate(invoice.created_at)}</p>
            </div>
            <div className="text-left min-w-0 shrink-0">
              <p className="text-sm sm:text-lg font-bold leading-tight mb-1">{businessName}</p>
              {businessDetailsItems.length > 0 && (
                issuerLayout === "column" ? (
                  <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-0.5">
                    {businessDetailsItems.map((item, i) => (
                      <p key={i}>{item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{businessDetailsItems.join(" • ")}</p>
                )
              )}
            </div>
          </div>

          {/* פרטי לקוח */}
          <div className="mb-4 sm:mb-6">
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">ל:</p>
            {client ? (
              <div className="leading-relaxed text-xs sm:text-sm">
                <p className="font-semibold text-sm sm:text-base">{client.name}</p>
                {client.address && <p className="text-xs sm:text-sm mt-1">{client.address}</p>}
                <div className="flex flex-wrap gap-x-2 sm:gap-x-4 gap-y-0 text-xs sm:text-sm mt-1">
                  {client.phone && <span>{client.phone}</span>}
                  {client.email && <span>{client.email}</span>}
                  {client.identity_number && <span>ת.ז./ח.פ. {client.identity_number}</span>}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-xs sm:text-sm">ללא פרטי לקוח</p>
            )}
          </div>

          {/* טבלת פריטים */}
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold align-bottom">תיאור</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold w-14 sm:w-20 align-bottom">כמות</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold w-20 sm:w-28 align-bottom">מחיר</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold w-12 sm:w-20 align-bottom">הנחה</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-3 font-semibold w-20 sm:w-28 align-bottom">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-right align-top">{item.description}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-right align-top tabular-nums">{item.quantity}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-right align-top tabular-nums">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-right align-top tabular-nums">
                    {item.discount ?? 0}%
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-right align-top tabular-nums font-medium">
                    {formatCurrency(item.total ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* סה"כ + מע"מ (עוסק פטור) */}
          <div className="flex justify-end mt-4 sm:mt-6">
            <div className="text-right border-t-2 border-black pt-2 sm:pt-3 min-w-[140px] sm:min-w-[200px] space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between gap-4 sm:gap-6">
                <span>סה"כ לפני מע״מ:</span>
                <span className="tabular-nums font-medium">{formatCurrency(invoice.total ?? 0)}</span>
              </div>
              <div className="flex justify-between gap-4 sm:gap-6">
                <span>מע״מ (עוסק פטור):</span>
                <span className="tabular-nums">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between gap-4 sm:gap-6 pt-2 border-t border-gray-300">
                <span className="font-semibold">סה"כ לתשלום:</span>
                <span className="text-base sm:text-xl font-bold tabular-nums">{formatCurrency(invoice.total ?? 0)}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2">עוסק פטור - המחיר פטור ממע״מ</p>
            </div>
          </div>

          {/* אישור שולם + אמצעי תשלום + תאריך פירעון + תאריך תשלום – כנדרש בחוק */}
          {invoice.payment_status === "paid" && invoice.type !== "credit" && (
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-black">
              <div className="flex flex-col gap-y-1 text-sm sm:text-base font-semibold">
                <span>שולם</span>
                {invoice.payment_method && (
                  <span className="text-gray-700">
                    אמצעי תשלום: {PAYMENT_METHODS.find((m) => m.value === invoice.payment_method)?.label ?? invoice.payment_method}
                  </span>
                )}
                {invoice.due_date && (
                  <span className="text-gray-700">תאריך פירעון: {formatDate(invoice.due_date)}</span>
                )}
                {invoice.paid_at && (
                  <span className="text-gray-700">תאריך תשלום: {formatDate(invoice.paid_at)}</span>
                )}
              </div>
            </div>
          )}

          {/* תאריך פירעון (לא ששולם) */}
          {invoice.payment_status !== "paid" && invoice.due_date && (
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
              תאריך פירעון: {formatDate(invoice.due_date)}
            </p>
          )}

          {/* הערות + תאריך עריכה (בקטן) */}
          {(invoice.notes || (showEditDate && wasEdited)) && (
            <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-300">
              {invoice.notes && (
                <>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">הערות:</p>
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                </>
              )}
              {showEditDate && wasEdited && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-2">נערך לאחרונה: {formatDate(invoice.updated_at)}</p>
              )}
            </div>
          )}

          {(user?.settings as UserSettings)?.signature_url && (
            <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 flex flex-col items-end">
              <img
                src={(user?.settings as UserSettings).signature_url!}
                alt="חתימה"
                className="h-8 sm:h-12 object-contain max-w-[120px] sm:max-w-[180px]"
              />
            </div>
          )}

          {(() => {
            const footer = (user?.settings as UserSettings)?.document_footer;
            const text = footer === undefined ? DOCUMENT_DISCLAIMER : (footer || null);
            return text ? (
              <p className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500">{text}</p>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
