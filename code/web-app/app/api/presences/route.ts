import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function getUserFromSession() {
  const session = await getSession();
  if (!session || typeof session !== "object" || !("user" in session)) return null;
  return (session as any).user;
}

export async function GET(req: Request) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  const isAdmin = user.fk_role === 1;

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userid");     // <- query param
  const start_date = searchParams.get("start_date");      // ISO ou "YYYY-MM-DD"
  const end_date = searchParams.get("end_date");          // ISO ou "YYYY-MM-DD"

  // ✅ userId effectif
  const effectiveUserId = isAdmin && requestedUserId ? Number(requestedUserId) : Number(user.pk_utilisateur);

  if (!effectiveUserId || Number.isNaN(effectiveUserId)) {
    return NextResponse.json({ message: "userid invalide" }, { status: 400 });
  }

  try {
    let query = `
      SELECT 
        p.pk_pointage,
        p.fk_utilisateur,
        p.date_pointage,
        p.heure_entree,
        p.heure_sortie,
        p.duree_minutes,
        u.prenom,
        u.nom
      FROM t_pointage p
      JOIN t_utilisateur u ON p.fk_utilisateur = u.pk_utilisateur
      WHERE p.fk_utilisateur = ?
    `;
    const params: any[] = [effectiveUserId];

    if (start_date) {
      query += " AND p.heure_entree >= ?";
      params.push(start_date);
    }

    if (end_date) {
      const endDate = end_date.includes(" ") ? end_date : `${end_date} 23:59:59`;
      query += " AND p.heure_entree <= ?";
      params.push(endDate);
    }

    query += " ORDER BY p.heure_entree ASC";

    const [rows] = (await db.query(query, params)) as any;

    const events = rows.map((p: any) => ({
      id: p.pk_pointage,
      start: new Date(p.heure_entree).toISOString(),
      end: p.heure_sortie ? new Date(p.heure_sortie).toISOString() : new Date(p.heure_entree).toISOString(),
      label: p.heure_sortie ? "Présent" : "⚠️ Incomplet",
      is_incomplete: !p.heure_sortie,
      user: { prenom: p.prenom, nom: p.nom },
    }));

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
