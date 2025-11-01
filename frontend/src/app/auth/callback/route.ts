// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user after email confirmation

      if (data.session) {
        try {
          // Create user profile in your backend
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/user-service/v1/users`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${data.session.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name:
                  data.user.user_metadata?.name ||
                  data.user.email?.split("@")[0] ||
                  "",
                email: data.user.email,
              }),
            }
          );
        } catch (fetchError) {
          console.error("Failed to create user profile:", fetchError);
          // Don't block the redirect if profile creation fails
        }
      }

      // Email confirmed successfully, redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // Auth error occurred
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        `${origin}/landing?error=auth_callback_error`
      );
    }
  }

  // No code provided, redirect to landing
  return NextResponse.redirect(`${origin}/landing`);
}
