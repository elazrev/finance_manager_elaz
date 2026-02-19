"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userFormSchema, type UserFormInput } from "@/lib/validations/user";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, FileText, Upload, Image as ImageIcon, PenLine, Palette, Sun, Moon, Monitor, Calendar, Type } from "lucide-react";
import { SignaturePad } from "@/components/signature-pad";
import { setThemeImmediate, setThemeColorImmediate, setFontSizeImmediate } from "@/components/theme-provider";
import type { ThemeColor, FontSize } from "@/components/theme-provider";
import type { User, UserSettings } from "@/types";
import { DOCUMENT_DISCLAIMER } from "@/lib/constants";

const documentSettingsSchema = z.object({
  document_footer: z.string().max(1000).optional().nullable(),
  logo_url: z.string().max(500000).optional().nullable(),
  signature_url: z.string().max(500000).optional().nullable(),
  document_primary_color: z.string().max(20).optional().nullable(),
  document_accent_color: z.string().max(20).optional().nullable(),
  issuer_details_layout: z.enum(["row", "column"]).optional(),
  show_edit_date_on_documents: z.boolean().optional(),
});
type DocumentSettingsInput = z.infer<typeof documentSettingsSchema>;

type SettingsTab = "general" | "document" | "import";

function toFormValues(u: User | null): UserFormInput | undefined {
  if (!u) return undefined;
  const s = (u.settings || {}) as UserSettings;
  return {
    business_name: u.business_name ?? "",
    phone: u.phone ?? "",
    address: u.address ?? "",
    tax_id: u.tax_id ?? "",
    invoice_prefix: s.invoice_prefix ?? "INV",
    quote_prefix: s.quote_prefix ?? "QUO",
    payment_request_prefix: s.payment_request_prefix ?? "DR",
    payment_terms: s.payment_terms ?? 30,
    theme: s.theme ?? "system",
    themeColor: s.themeColor ?? "blue",
    fontSize: s.fontSize ?? "md",
  };
}

function toUpdatePayload(data: UserFormInput) {
  return {
    business_name: data.business_name || null,
    phone: data.phone || null,
    address: data.address || null,
    tax_id: data.tax_id || null,
    settings: {
      invoice_prefix: data.invoice_prefix || "INV",
      quote_prefix: data.quote_prefix ?? "QUO",
      payment_terms: data.payment_terms ?? 30,
      theme: data.theme ?? "system",
      themeColor: data.themeColor ?? "blue",
      fontSize: data.fontSize ?? "md",
    },
  };
}

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "כללי", icon: Settings },
  { id: "document", label: "הגדרות מסמך", icon: FileText },
  { id: "import", label: "ייבוא", icon: Upload },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("שגיאה בטעינת הנתונים");
      const j = await res.json();
      return j.data as User;
    },
  });

  const { register, handleSubmit, setValue, watch } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    values: toFormValues(user ?? null),
  });

  const updateAppearance = useMutation({
    mutationFn: async (payload: { theme?: "light" | "dark" | "system"; themeColor?: ThemeColor; fontSize?: FontSize }) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error("שגיאה בשמירה");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  });

  const handleThemeChange = (t: "light" | "dark" | "system") => {
    setThemeImmediate(t);
    updateAppearance.mutate({ theme: t });
  };

  const handleThemeColorChange = (c: ThemeColor) => {
    setValue("themeColor", c);
    setThemeColorImmediate(c);
    updateAppearance.mutate({ themeColor: c });
  };

  const handleFontSizeChange = (f: FontSize) => {
    setValue("fontSize", f);
    setFontSizeImmediate(f);
    updateAppearance.mutate({ fontSize: f });
  };

  const THEME_COLORS: { value: ThemeColor; label: string; sample: string }[] = [
    { value: "blue", label: "כחול", sample: "bg-blue-500" },
    { value: "amber", label: "ענבר", sample: "bg-amber-500" },
    { value: "emerald", label: "אמרלד", sample: "bg-emerald-500" },
    { value: "violet", label: "סגול", sample: "bg-violet-500" },
    { value: "rose", label: "ורוד", sample: "bg-rose-500" },
    { value: "slate", label: "אפור", sample: "bg-slate-500" },
  ];

  const s = (user?.settings || {}) as UserSettings;
  const docForm = useForm<DocumentSettingsInput>({
    resolver: zodResolver(documentSettingsSchema),
    values: {
      document_footer: s.document_footer !== undefined ? (s.document_footer ?? "") : DOCUMENT_DISCLAIMER,
      logo_url: s.logo_url ?? "",
      signature_url: s.signature_url ?? "",
      document_primary_color: s.document_primary_color ?? "#000000",
      document_accent_color: s.document_accent_color ?? "#6b7280",
      issuer_details_layout: s.issuer_details_layout ?? "row",
      show_edit_date_on_documents: s.show_edit_date_on_documents ?? true,
    },
  });

  const update = useMutation({
    mutationFn: async (data: UserFormInput) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toUpdatePayload(data)),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בשמירה");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const updateDocSettings = useMutation({
    mutationFn: async (data: DocumentSettingsInput) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            document_footer: data.document_footer || null,
            logo_url: data.logo_url || null,
            signature_url: data.signature_url || null,
            document_primary_color: data.document_primary_color || null,
            document_accent_color: data.document_accent_color || null,
            issuer_details_layout: data.issuer_details_layout || "row",
            show_edit_date_on_documents: data.show_edit_date_on_documents,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "שגיאה בשמירה");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const saveDocSettingsNow = useCallback(
    (overrides?: Partial<DocumentSettingsInput>) => {
      const values: DocumentSettingsInput = { ...docForm.getValues(), ...overrides };
      updateDocSettings.mutate(values);
    },
    [docForm, updateDocSettings]
  );

  const handleFileToDataUrl = (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "signature_url") => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      docForm.setValue(field, dataUrl);
      saveDocSettingsNow({ [field]: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <div className="container mx-auto p-8">טוען...</div>;

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">הגדרות</h1>
        <p className="text-lg text-muted-foreground">
          ניהול פרטי העסק והגדרות המערכת
        </p>
      </div>

      <div className="flex gap-2 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <form onSubmit={handleSubmit((data) => {
          setThemeImmediate((data.theme as "light" | "dark" | "system") ?? "system");
          update.mutate(data);
        })} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                מראה וערכת נושא
              </CardTitle>
              <CardDescription>
                בחר ערכת נושא – בהיר, כהה, או התאמה למערכת ההפעלה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    {...register("theme")}
                    value="light"
                    onChange={() => handleThemeChange("light")}
                    className="mt-1"
                  />
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">בהיר</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    {...register("theme")}
                    value="dark"
                    onChange={() => handleThemeChange("dark")}
                    className="mt-1"
                  />
                  <div className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-indigo-400" />
                    <span className="font-medium">כהה</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input
                    type="radio"
                    {...register("theme")}
                    value="system"
                    onChange={() => handleThemeChange("system")}
                    className="mt-1"
                  />
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">לפי המערכת</span>
                  </div>
                </label>
              </div>
              <div>
                <Label className="text-base font-medium">צבע ערכת הנושא</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  בחירת צבע ראשי לכפתורים ולאזור הפעיל – נותן חיים לאפליקציה
                </p>
                <div className="flex flex-wrap gap-2">
                  {THEME_COLORS.map(({ value, label, sample }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleThemeColorChange(value)}
                      className={
                        (watch("themeColor") ?? s.themeColor ?? "blue") === value
                          ? "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors border-primary bg-primary/10 ring-2 ring-primary/30"
                          : "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors border-border hover:bg-muted/50"
                      }
                    >
                      <span className={`w-4 h-4 rounded-full ${sample}`} aria-hidden />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  גודל טקסט
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  משפיע על תצוגת האפליקציה בלבד – לא על מסמכים או PDF
                </p>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleFontSizeChange(size)}
                      className={
                        (watch("fontSize") ?? s.fontSize ?? "md") === size
                          ? "px-4 py-2 rounded-lg border transition-colors border-primary bg-primary text-primary-foreground"
                          : "px-4 py-2 rounded-lg border transition-colors border-border hover:bg-muted/50"
                      }
                    >
                      {size === "sm" ? "קטן" : size === "md" ? "בינוני" : "גדול"}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>פרטי העסק</CardTitle>
              <CardDescription>עדכן את פרטי העסק שלך</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">האימייל לא ניתן לשינוי (מגיע מחשבון ההתחברות)</p>
              </div>
              <div>
                <Label htmlFor="business_name">שם העסק</Label>
                <Input id="business_name" {...register("business_name")} placeholder="שם העסק או השם שלך" />
              </div>
              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" {...register("phone")} placeholder="מספר טלפון" />
              </div>
              <div>
                <Label htmlFor="address">כתובת</Label>
                <Input id="address" {...register("address")} placeholder="כתובת מלאה" />
              </div>
              <div>
                <Label htmlFor="tax_id">מספר עוסק / ח.פ.</Label>
                <Input id="tax_id" {...register("tax_id")} placeholder="מספר עוסק פטור או ח.פ." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>הגדרות מערכת</CardTitle>
              <CardDescription>קידומות ומספרים אוטומטיים</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoice_prefix">קידומת חשבוניות</Label>
                <Input id="invoice_prefix" {...register("invoice_prefix")} placeholder="INV" />
              </div>
              <div>
                <Label htmlFor="quote_prefix">קידומת הצעות מחיר</Label>
                <Input id="quote_prefix" {...register("quote_prefix")} placeholder="QUO" />
              </div>
              <div>
                <Label htmlFor="payment_request_prefix">קידומת דרישות תשלום</Label>
                <Input id="payment_request_prefix" {...register("payment_request_prefix")} placeholder="DR" />
              </div>
              <div>
                <Label htmlFor="payment_terms">תנאי תשלום (ימים)</Label>
                <Input id="payment_terms" type="number" {...register("payment_terms")} placeholder="30" />
              </div>
            </CardContent>
          </Card>

          {update.isError && <p className="text-sm text-destructive">{update.error.message}</p>}
          {update.isSuccess && <p className="text-sm text-green-600">השינויים נשמרו בהצלחה</p>}

          <Button type="submit" size="lg" disabled={update.isPending}>
            {update.isPending ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      )}

      {activeTab === "document" && (
        <form
          onSubmit={docForm.handleSubmit((data) => updateDocSettings.mutate(data))}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" aria-hidden />
                לוגו
              </CardTitle>
              <CardDescription>
                יופיע בקטן במרכז החלק העליון של המסמכים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {docForm.watch("logo_url") ? (
                <div className="flex items-center gap-4">
                  <img src={docForm.watch("logo_url")!} alt="לוגו" className="h-20 object-contain" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      docForm.setValue("logo_url", "");
                      saveDocSettingsNow({ logo_url: null });
                    }}
                  >
                    הסר לוגו
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileToDataUrl(e, "logo_url")}
                    className="max-w-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                חתימה
              </CardTitle>
              <CardDescription>
                צייר את חתימתך עם העכבר או המגע – תשולב במסמכים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {docForm.watch("signature_url") ? (
                <div className="flex items-center gap-4">
                  <img src={docForm.watch("signature_url")!} alt="חתימה" className="h-16 object-contain" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      docForm.setValue("signature_url", "");
                      saveDocSettingsNow({ signature_url: null });
                    }}
                  >
                    הסר חתימה
                  </Button>
                </div>
              ) : (
                <SignaturePad
                  value={docForm.watch("signature_url") || ""}
                  onChange={(dataUrl) => {
                    docForm.setValue("signature_url", dataUrl);
                    saveDocSettingsNow({ signature_url: dataUrl });
                  }}
                  onSaving={updateDocSettings.isPending}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                צבעי מסמכים
              </CardTitle>
              <CardDescription>
                שליטה בצבעי המסמכים – ישולבו בעיצוב העתידי
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <Label htmlFor="document_primary_color">צבע ראשי</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="document_primary_color"
                      type="color"
                      value={docForm.watch("document_primary_color") || "#000000"}
                      onChange={(e) => docForm.setValue("document_primary_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={docForm.watch("document_primary_color") || "#000000"}
                      onChange={(e) => docForm.setValue("document_primary_color", e.target.value)}
                      className="w-24 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="document_accent_color">צבע משני</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="document_accent_color"
                      type="color"
                      value={docForm.watch("document_accent_color") || "#6b7280"}
                      onChange={(e) => docForm.setValue("document_accent_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={docForm.watch("document_accent_color") || "#6b7280"}
                      onChange={(e) => docForm.setValue("document_accent_color", e.target.value)}
                      className="w-24 font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>הצגת פרטי מנפיק</CardTitle>
              <CardDescription>
                כיצד להציג את פרטי העסק (כתובת, טלפון, אימייל, ח.פ.) במסמכים – בשורה אחת או ברשימה טורית מתחת לשם העסק
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    {...docForm.register("issuer_details_layout")}
                    value="row"
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">שורה אחת</span>
                    <p className="text-sm text-muted-foreground mt-1">כתובת • טלפון • אימייל • ח.פ. (מופרדים בנקודה)</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    {...docForm.register("issuer_details_layout")}
                    value="column"
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">רשימה טורית</span>
                    <p className="text-sm text-muted-foreground mt-1">כל פרט בשורה נפרדת מתחת לשם העסק</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                תאריך עריכה
              </CardTitle>
              <CardDescription>
                האם להציג תאריך העריכה (בקטן) במסמכים שנערכו – חשבוניות, הצעות מחיר, דרישות תשלום
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={docForm.watch("show_edit_date_on_documents") ?? true}
                  onChange={(e) => {
                    docForm.setValue("show_edit_date_on_documents", e.target.checked);
                    saveDocSettingsNow({ show_edit_date_on_documents: e.target.checked });
                  }}
                  className="h-4 w-4 rounded border"
                />
                <span>הצג תאריך עריכה במסמכים שנערכו</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>טקסט בתחתית מסמכים</CardTitle>
              <CardDescription>
                טקסט זה יופיע בתחתית כל המסמכים: חשבוניות, הצעות מחיר, דרישות תשלום. ניתן להשאיר ריק כדי להסתיר את הפוטר.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="document_footer">פוטר מסמכים</Label>
                <Textarea
                  id="document_footer"
                  {...docForm.register("document_footer")}
                  placeholder={DOCUMENT_DISCLAIMER}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  לדוגמה: * אישורי בטיחות, אישורי מהנדס וביטוחים הינם באחריותו של הלקוח בלבד.
                </p>
              </div>
            </CardContent>
          </Card>

          {updateDocSettings.isError && <p className="text-sm text-destructive">{updateDocSettings.error.message}</p>}
          {updateDocSettings.isSuccess && <p className="text-sm text-green-600">השינויים נשמרו בהצלחה</p>}

          <Button type="submit" size="lg" disabled={updateDocSettings.isPending}>
            {updateDocSettings.isPending ? "שומר..." : "שמור שינויים"}
          </Button>
        </form>
      )}

      {activeTab === "import" && (
        <Card>
          <CardHeader>
            <CardTitle>ייבוא נתונים</CardTitle>
            <CardDescription>
              כאן תוכלו להעביר מידע מפלטפורמות אחרות.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground font-medium">בפיתוח</p>
            <p className="text-sm text-muted-foreground">
              האפשרות לייבוא נתונים ממערכות אחרת (למשל Excel, חשבונאות מקוונת וכו׳) נמצאת כעת בפיתוח. נשמח לחזור עם פיצ׳ר מלא בקרוב.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
