import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get("session");
  const session = cookie ? await decrypt(cookie.value) : null;
  
  // Décrypter la session si elle existe
  const payload = session;

  // Définir les routes protégées et les rôles requis
  const path = request.nextUrl.pathname;

  // 1. Rediriger vers /login si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
  // On exclut /login, /api/auth, et les fichiers statiques (_next, images, etc.)
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

  // 2. Rediriger vers / (ou dashboard) si l'utilisateur est déjà connecté et essaie d'accéder à /login
  if (payload && path === "/login") {
    // Redirection basée sur le rôle si nécessaire, sinon vers l'accueil
    if (payload && typeof payload === "object" && "user" in payload && (payload as any).user.pk_role === 1) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Vérification des rôles pour les routes /admin
  if (path.startsWith("/admin")) {
    // Vérifier si l'utilisateur a le rôle 'Administrateur' (ajustez selon vos valeurs en BDD)
    if (!payload || typeof payload !== "object" || !("user" in payload) || (payload as any).user.pk_role !== 1) {
      // Rediriger vers une page "Non autorisé" ou l'accueil
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // On inclut quand même /api/admin pour le protéger
    '/api/admin/:path*' 
  ],
};
