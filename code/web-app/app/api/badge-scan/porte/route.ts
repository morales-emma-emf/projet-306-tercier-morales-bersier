import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySignature } from "@/lib/signature";

export async function POST(req: Request) {
  try {
    const { badgeId, readerId, timestamp, signature } = await req.json();

    // Vérifier signature + anti-rejeu
    const sig = verifySignature({ badgeId, readerId, timestamp, signature });
    if (!sig.ok) {
      const reason = (sig as any).reason || "INVALID_SIGNATURE";
      const action = `Requête signée invalide (${reason}) pour badge ${badgeId}`;
      await db.query("INSERT INTO t_logs (action, event_type, date_action) VALUES (?, ?, ?)", [action, "warning", timestamp]);
      return NextResponse.json({ allowed: false, reason });
    }

    const porteId = Number(readerId);
    if (Number.isNaN(porteId)) {
      const action = `Scan sur lecteur inconnu '${readerId}' par badge ${badgeId}`;
      await db.query("INSERT INTO t_logs (action, event_type, date_action) VALUES (?, ?, ?)", [action, "error", timestamp]);
      return NextResponse.json({ allowed: false, reason: "UNKNOWN_READER" });
    }

    const [userRows] = (await db.query("SELECT * FROM t_utilisateur WHERE id_badge = ?", [badgeId])) as any;
    const user = Array.isArray(userRows) && userRows.length > 0 ? userRows[0] : null;
    if (!user) {
      const action = `Tentative de badge inconnu : ${badgeId}`;
      await db.query("INSERT INTO t_logs (action, event_type, date_action) VALUES (?, ?, ?)", [action, "error", timestamp]);
      return NextResponse.json({ allowed: false, reason: "UNKNOWN_BADGE" });
    }

    const [accessRows] = (await db.query(
      `SELECT 1 as ok FROM tr_utilisateur_porte WHERE fk_utilisateur = ? AND fk_porte = ?
       UNION
       SELECT 1 as ok FROM tr_role_porte WHERE fk_role = ? AND fk_porte = ?
       LIMIT 1`,
      [user.pk_utilisateur, porteId, user.fk_role, porteId]
    )) as any;

    const hasAccess = Array.isArray(accessRows) && accessRows.length > 0;

    if (hasAccess) {
      const action = `Ouverture de la porte ${porteId} par ${user.nom} ${user.prenom}`;
      await db.query("INSERT INTO t_logs (action, event_type, date_action, fk_utilisateur, fk_porte) VALUES (?, ?, ?, ?, ?)", [action, "access", timestamp, user.pk_utilisateur, porteId]);
      return NextResponse.json({ allowed: true, action: "OUVERTURE_PORTE", porte: porteId });
    } else {
      const action = `Tentative d'ouverture de la porte ${porteId} par ${user.nom} ${user.prenom}`;
      await db.query("INSERT INTO t_logs (action, event_type, date_action, fk_utilisateur, fk_porte) VALUES (?, ?, ?, ?, ?)", [action, "warning", timestamp, user.pk_utilisateur, porteId]);
      return NextResponse.json({ allowed: false, reason: "ACCESS_DENIED" });
    }
  } catch (error) {
    console.error("Erreur lors du traitement du check porte:", error);
    return NextResponse.json({ allowed: false, reason: "SERVER_ERROR" });
  }
}
