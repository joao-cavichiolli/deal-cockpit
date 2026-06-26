import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { session } = data;
      const providerToken = session.provider_token;
      const providerRefreshToken = session.provider_refresh_token;

      // Save Google token to connections table
      if (providerToken) {
        await supabase.from("connections").upsert(
          {
            user_id: session.user.id,
            provider: "google",
            access_token: providerToken,
            refresh_token: providerRefreshToken ?? null,
            scopes: "gmail.send gmail.readonly",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,provider" }
        );
      }

      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=callback", origin));
}
