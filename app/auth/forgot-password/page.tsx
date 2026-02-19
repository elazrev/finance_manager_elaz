"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("root", { message: error.message || "שגיאה בשליחת האימייל" });
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">בדוק את האימייל</CardTitle>
            <CardDescription className="text-center">
              נשלח אליך קישור לאיפוס הסיסמה. לחץ על הקישור באימייל כדי לבחור סיסמה חדשה.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              לא קיבלת אימייל? בדוק את תיקיית הספאם או{" "}
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="text-primary hover:underline"
              >
                נסה שוב
              </button>
            </p>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full">חזור להתחברות</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">שכחת סיסמה</CardTitle>
          <CardDescription className="text-center">
            הזן את האימייל שלך ונשלח אליך קישור לאיפוס הסיסמה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "שולח..." : "שלח קישור לאיפוס"}
            </Button>
            <Link href="/auth/login" className="block text-center text-sm text-primary hover:underline">
              חזור להתחברות
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
