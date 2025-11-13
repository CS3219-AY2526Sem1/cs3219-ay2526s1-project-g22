import { createClient } from "../../../../lib/supabase/supabase-server";
import { getURL } from "../../../../utils/url-helper";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Proof Key for Code Exchange (PKCE) - exchange code -> get session
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const error = requestUrl.searchParams.get("error");
  if (error) {
    // TODO: Implement a better way to communicate with user
    return NextResponse.redirect(getURL("/landing"));
  }

  const code = requestUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // TODO: Implement a better way to communicate with user
      return NextResponse.redirect(getURL("/landing"));
    }

    // For some reason, exchangeCodeForSession doesn't update the cookies automatically.
    // Manually updating all cookies
    const cookieStore = await cookies();
    for (const cookie of req.cookies.getAll()) {
      cookieStore.set(cookie.name, cookie.value);
    }
  }

  // * We cannot directly get the origin from requestUrl.origin
  // * https://community.fly.io/t/nextjs-api-route-request-url-origin-returns-0-0-0-0-3000-with-domain-assigned/20708
  // * Hence we just use the Host URL to redirect.
  return NextResponse.redirect(getURL("/reset-password"));
}
