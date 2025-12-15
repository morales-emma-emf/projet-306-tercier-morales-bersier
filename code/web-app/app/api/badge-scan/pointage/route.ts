import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { badgeId, readerId } = await req.json();
    // Utiliser le timestamp serveur pour éviter de faire confiance au client
    const serverTimestamp = new Date().toISOString();

    const [userRows] = (await db.query(
      "SELECT * FROM t_utilisateur WHERE id_badge = ?",
      [badgeId]
    )) as any;

    const user = Array.isArray(userRows) && userRows.length > 0 ? userRows[0] : null;

    if (!user) {
      const action = `Tentative de badge inconnu : ${badgeId}`;
      await db.query(
        "INSERT INTO t_logs (action, event_type, date_action) VALUES (?, ?, ?)",
        [action, "error", serverTimestamp]
      );
      return NextResponse.json({ allowed: false, reason: "UNKNOWN_BADGE" });
    }

    // Lecteur de pointage
    if (readerId === "pointage") {
      const [ptRows] = (await db.query(
        "SELECT * FROM t_pointage WHERE fk_utilisateur = ? ORDER BY pk_pointage DESC LIMIT 1",
        [user.pk_utilisateur]
      )) as any;

      const lastPointage = Array.isArray(ptRows) && ptRows.length > 0 ? ptRows[0] : null;

      if (lastPointage && !lastPointage.heure_sortie) {
        // sortie (pointage de fin de journée)
        const heureSortie = serverTimestamp;
        const entreeMs = lastPointage && lastPointage.heure_entree ? new Date(lastPointage.heure_entree).getTime() : NaN;
        let dureeMinutes: number | null = null;
        if (!Number.isNaN(entreeMs)) {
          dureeMinutes = Math.floor((new Date(heureSortie).getTime() - entreeMs) / 60000);
        }
        await db.query(
          "UPDATE t_pointage SET heure_sortie = ?, duree_minutes = ? WHERE pk_pointage = ?",
          [heureSortie, dureeMinutes, lastPointage.pk_pointage]
        );

        const action = `Sortie : ${user.nom} ${user.prenom} à ${heureSortie}`;
        await db.query(
          "INSERT INTO t_logs (action, event_type, date_action, fk_utilisateur) VALUES (?, ?, ?, ?)",
          [action, "access", serverTimestamp, user.pk_utilisateur]
        );

        return NextResponse.json({ allowed: true, action: "POINTAGE_SORTIE", user: { id: user.pk_utilisateur } });
      } else {
        // entrée (pointage de début de journée)
        const heureEntree = serverTimestamp;
        await db.query(
          "INSERT INTO t_pointage (fk_utilisateur, date_pointage, heure_entree) VALUES (?, ?, ?)",
          [user.pk_utilisateur, serverTimestamp, heureEntree]
        );
        const action = `Entrée : ${user.nom} ${user.prenom} à ${heureEntree}`;
        await db.query(
          "INSERT INTO t_logs (action, event_type, date_action, fk_utilisateur) VALUES (?, ?, ?, ?)",
          [action, "access", serverTimestamp, user.pk_utilisateur]
        );

        return NextResponse.json({ allowed: true, action: "POINTAGE_ENTREE", user: { id: user.pk_utilisateur } });
      }
    }

    // Ce endpoint gère uniquement le pointage. Si le lecteur n'est pas de type "pointage",
    // renvoyer un refus explicite (le contrôle des portes est géré par un autre endpoint).
    return NextResponse.json({ allowed: false, reason: "NOT_POINTAGE_READER" });
  } catch (error) {
    console.error("Erreur lors du traitement du scan de badge:", error);
    return NextResponse.json({ allowed: false, reason: "SERVER_ERROR" });
  }
}
