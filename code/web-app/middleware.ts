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
 
  // 1) si pas connecté -> redirect login (sauf routes publiques)
  if (!payload && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
 
  // 2) si connecté et va sur /login -> redirect dashboard selon rôle
  if (payload && path === "/login") {
    const role = (payload as any)?.user?.fk_role; 
    if (Number(role) === 1) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dev", request.url)); // ou "/" si tu as une home
  }
 
  // 3) protéger dashboard/users (ADMIN only)
  if (path.startsWith("/dashboard") || path.startsWith("/users")) {
    const role = (payload as any)?.user?.fk_role;
    if (Number(role) !== 1) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/api/admin/:path*",
  ],
};