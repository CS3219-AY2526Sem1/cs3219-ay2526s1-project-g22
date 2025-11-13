import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import { createClient } from "./lib/supabase/supabase-server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // TODO temporary generate random user id
  if (request.nextUrl.pathname.startsWith("/room")) {
    if (!request.cookies.get("userId")) {
      const userId = randomId("user");
      response.cookies.set("userId", userId, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
      });
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const protectedRoutes = ["/", "/room", "/matching"];
  const protectedPatterns = [/^\/room\/[^\/]+$/]; // matches /room/:id

  const publicRoutes = ["/landing", "/forgot-password"];

  const path = request.nextUrl.pathname;
  const isProtectedRoute =
    protectedRoutes.includes(path) ||
    protectedPatterns.some((pattern) => pattern.test(path));
  const isPublicRoute = publicRoutes.includes(path);

  // Redirect to /landing if the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.redirect(url);
  }

  // Redirect to / if the user is authenticated and trying to access a public route
  if (isPublicRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// TOOD temporary random user id
function randomId(prefix = "u") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
