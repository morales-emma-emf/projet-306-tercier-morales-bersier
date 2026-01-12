import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

function toMysql(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function PATCH(req: Request) {
  try {
    const cookie = (await cookies()).get("session");
    const payload = cookie ? await decrypt(cookie.value) : null;
    const sessionUser = (payload as any)?.user;

    if (!sessionUser) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const { pointage_id, heure_sortie } = await req.json();
    const id = Number(pointage_id);
    const sortieMysql = toMysql(heure_sortie);

    if (!id || !sortieMysql) {
      return NextResponse.json(
        { message: "pointage_id / heure_sortie invalides" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT pk_pointage, fk_utilisateur, heure_entree, heure_sortie FROM t_pointage WHERE pk_pointage = ?",
      [id]
    );

    if (!rows?.length) {
      return NextResponse.json({ message: "Pointage introuvable" }, { status: 404 });
    }

    const p = rows[0];

    const isAdmin = Number(sessionUser.fk_role) === 1;
    const isOwner = Number(sessionUser.pk_utilisateur) === Number(p.fk_utilisateur);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Accès refusé" }, { status: 403 });
    }

    if (p.heure_sortie) {
      return NextResponse.json({ message: "Déjà complété" }, { status: 409 });
    }

    
    const entreeMs = new Date(p.heure_entree).getTime();
    const sortieMs = new Date(sortieMysql.replace(" ", "T")).getTime();

    if (Number.isNaN(sortieMs) || sortieMs <= entreeMs) {
      return NextResponse.json(
        { message: "Sortie doit être après l'entrée" },
        { status: 400 }
      );
    }

   
    const dayEntree = new Date(p.heure_entree).toISOString().slice(0, 10);
    const daySortie = new Date(sortieMysql.replace(" ", "T")).toISOString().slice(0, 10);
    if (dayEntree !== daySortie) {
      return NextResponse.json(
        { message: "La sortie doit être le même jour que l'entrée" },
        { status: 400 }
      );
    }

    const endFallback = `${dayEntree} 20:00:00`;

    const [overlaps]: any = await db.query(
      `
      SELECT pk_pointage
      FROM t_pointage
      WHERE fk_utilisateur = ?
        AND pk_pointage <> ?
        AND heure_entree < ?
        AND COALESCE(heure_sortie, ?) > ?
      LIMIT 1
      `,
      [p.fk_utilisateur, id, sortieMysql, endFallback, p.heure_entree]
    );

    if (overlaps?.length) {
      return NextResponse.json(
        { message: "Chevauchement détecté : ta sortie chevauche un autre pointage." },
        { status: 409 }
      );
    }

    const dureeMinutes = Math.floor((sortieMs - entreeMs) / 60000);

    await db.query(
      "UPDATE t_pointage SET heure_sortie = ?, duree_minutes = ? WHERE pk_pointage = ? AND heure_sortie IS NULL",
      [sortieMysql, dureeMinutes, id]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("COMPLETE SORTIE ERROR:", e);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
