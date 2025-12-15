import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  // 1. Vérifier si l'utilisateur est connecté
  if (!session) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  // 2. Vérifier si l'utilisateur a le rôle requis
  if (!session.user || typeof session.user !== "object" || (session.user as any).pk_role !== 1) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  // 3. Logique de l'API pour les admins
  return NextResponse.json({ 
    message: "Bienvenue dans la zone admin",
    secretData: [1, 2, 3] 
  });
}
