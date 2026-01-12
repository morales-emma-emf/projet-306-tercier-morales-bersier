import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get("session");
  const payload = cookie ? await decrypt(cookie.value) : null;

  const path = request.nextUrl.pathname;

  const isPublicPath =
    path === "/login" ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path === "/favicon.ico" ||
    path === "/dev";

  
  if (!payload && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  
  if (payload && path === "/login") {
    const role = (payload as any)?.user?.fk_role;
    if (Number(role) === 1) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/users", request.url));
  }

  if (path.startsWith("/dashboard") || path.startsWith("/logs")) {
    const role = (payload as any)?.user?.fk_role;
    if (Number(role) !== 1) {
      return NextResponse.redirect(new URL("/users", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico).*)",
    "/api/admin/:path*",
  ],
};
