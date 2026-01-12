import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

function mysqlDateTime(d: Date) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function autoEnd19hMysql(heureEntree: string) {
  const d = new Date(heureEntree);
  const auto = new Date(d);
  auto.setHours(20, 0, 0, 0);
  return mysqlDateTime(auto);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("userid"));
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({ message: "Params manquants" }, { status: 400 });
    }

    
    const cookie = (await cookies()).get("session");
    const payload = cookie ? await decrypt(cookie.value) : null;
    const sessionUser = (payload as any)?.user;

    if (!sessionUser) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = Number(sessionUser.fk_role) === 1;
    const isOwner = Number(sessionUser.pk_utilisateur) === Number(userId);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Accès refusé" }, { status: 403 });
    }

  
    const [rows]: any = await db.query(
      `
      SELECT 
        p.pk_pointage,
        p.heure_entree,
        p.heure_sortie,
        u.prenom,
        u.nom
      FROM t_pointage p
      JOIN t_utilisateur u ON u.pk_utilisateur = p.fk_utilisateur
      WHERE p.fk_utilisateur = ?
        AND p.heure_entree >= ?
        AND p.heure_entree < ?
      ORDER BY p.heure_entree ASC
      `,
      [userId, mysqlDateTime(new Date(startDate)), mysqlDateTime(new Date(endDate))]
    );

    const events = (rows || []).map((r: any) => {
      const incomplete = !r.heure_sortie;
      const end = r.heure_sortie ?? autoEnd19hMysql(r.heure_entree);

      return {
        id: r.pk_pointage,
        start: r.heure_entree,
        end,
        is_incomplete: incomplete,
        label: incomplete ? "Sortie manquante" : "Présence",
        user: { prenom: r.prenom, nom: r.nom },
        end_is_auto: incomplete,
      };
    });

    return NextResponse.json({ events });
  } catch (e) {
    console.error("PRESENCES GET ERROR:", e);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
