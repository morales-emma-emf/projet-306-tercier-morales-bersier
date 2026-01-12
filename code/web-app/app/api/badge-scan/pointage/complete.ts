import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

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
    if (!id || !heure_sortie) {
      return NextResponse.json({ message: "pointage_id et heure_sortie requis" }, { status: 400 });
    }

    // Récupérer le pointage
    const [rows]: any = await db.query(
      "SELECT pk_pointage, fk_utilisateur, heure_entree, heure_sortie FROM t_pointage WHERE pk_pointage = ?",
      [id]
    );

    if (!rows?.length) {
      return NextResponse.json({ message: "Pointage introuvable" }, { status: 404 });
    }

    const p = rows[0];

    // Autorisation: admin OU propriétaire
    const isAdmin = Number(sessionUser.fk_role) === 1;
    const isOwner = Number(p.fk_utilisateur) === Number(sessionUser.pk_utilisateur);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Accès refusé" }, { status: 403 });
    }

    if (p.heure_sortie) {
      return NextResponse.json({ message: "Sortie déjà renseignée" }, { status: 409 });
    }

    // Validation sortie > entrée
    const entreeMs = new Date(p.heure_entree).getTime();
    const sortieMs = new Date(heure_sortie).getTime();
    if (Number.isNaN(sortieMs) || sortieMs <= entreeMs) {
      return NextResponse.json(
        { message: "Heure sortie invalide (doit être après l'entrée)" },
        { status: 400 }
      );
    }

    const dureeMinutes = Math.floor((sortieMs - entreeMs) / 60000);

    // Format MySQL: YYYY-MM-DD HH:MM:SS
    const sortieMysql = new Date(sortieMs).toISOString().slice(0, 19).replace("T", " ");

    await db.query(
      "UPDATE t_pointage SET heure_sortie = ?, duree_minutes = ? WHERE pk_pointage = ? AND heure_sortie IS NULL",
      [sortieMysql, dureeMinutes, id]
    );

    // log (optionnel)
    const action = `Sortie complétée : utilisateur ${p.fk_utilisateur} à ${sortieMysql}`;
    const nowMysql = new Date().toISOString().slice(0, 19).replace("T", " ");
    await db.query(
      "INSERT INTO t_logs (action, event_type, date_action, fk_utilisateur) VALUES (?, ?, ?, ?)",
      [action, "manual", nowMysql, p.fk_utilisateur]
    );

    return NextResponse.json({ success: true, duree_minutes: dureeMinutes, heure_sortie: sortieMysql });
  } catch (err) {
    console.error("COMPLETE POINTAGE ERROR:", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
