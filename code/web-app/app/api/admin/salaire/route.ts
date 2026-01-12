import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
 
  const sql = `
    SELECT 
      u.pk_utilisateur,
      COALESCE(u.taux_horaire, 0) AS taux_horaire,
      COALESCE(SUM(p.duree_minutes), 0) AS total_minutes,
      ROUND((COALESCE(SUM(p.duree_minutes), 0) / 60) * COALESCE(u.taux_horaire, 0), 2) AS salaire_mois
    FROM t_utilisateur u
    LEFT JOIN t_pointage p
      ON p.fk_utilisateur = u.pk_utilisateur
      AND p.heure_entree >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      AND p.heure_entree < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
    GROUP BY u.pk_utilisateur, u.taux_horaire
  `;

  const [rows]: any = await db.query(sql);


  const result: Record<number, { total_minutes: number; salaire_mois: number; taux_horaire: number }> = {};
  for (const r of rows) {
    result[Number(r.pk_utilisateur)] = {
      total_minutes: Number(r.total_minutes ?? 0),
      salaire_mois: Number(r.salaire_mois ?? 0),
      taux_horaire: Number(r.taux_horaire ?? 0),
    };
  }

  return NextResponse.json(result);
}
