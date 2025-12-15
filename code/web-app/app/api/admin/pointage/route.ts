import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Helper pour vérifier si l'utilisateur est admin
async function isAdmin() {
  const session = await getSession();
  if (!session || typeof session !== "object" || !("user" in session)) return false;
  const user = (session as any).user;
  return user.pk_role === 1;
}

export async function GET(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fk_utilisateur = searchParams.get("userid");
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  try {
    let query = `
      SELECT p.*, u.prenom, u.nom 
      FROM t_pointage p
      JOIN t_utilisateur u ON p.fk_utilisateur = u.pk_utilisateur
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fk_utilisateur) {
      query += " AND p.fk_utilisateur = ?";
      params.push(fk_utilisateur);
    }

    if (start_date) {
      query += " AND p.date_pointage >= ?";
      params.push(start_date);
    }

    if (end_date) {
      const endDate = end_date.includes(" ") ? end_date : `${end_date} 23:59:59`;
      query += " AND p.date_pointage <= ?";
      params.push(endDate);
    }

    query += " ORDER BY p.heure_entree DESC";

    const [pointages] = await db.query(query, params) as any;

    // Enrichir les données pour le frontend (flag problème)
    const enrichedPointages = pointages.map((p: any) => ({
      ...p,
      is_incomplete: !p.heure_sortie, // Flag pour indiquer un problème (pas de sortie)
      title: !p.heure_sortie ? "⚠️ Pointage incomplet" : "Pointage validé"
    }));

    return NextResponse.json(enrichedPointages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { fk_utilisateur, date_pointage, heure_entree, heure_sortie } = body;

    if (!fk_utilisateur || !heure_entree) {
      return NextResponse.json({ message: "Utilisateur et heure d'entrée requis" }, { status: 400 });
    }

    // Calcul de la durée si sortie présente
    let duree_minutes = null;
    if (heure_sortie) {
      const start = new Date(heure_entree).getTime();
      const end = new Date(heure_sortie).getTime();
      duree_minutes = Math.round((end - start) / 60000);
    }

    // Si date_pointage n'est pas fourni, on prend la date de l'heure d'entrée
    const dateRef = date_pointage || new Date(heure_entree).toISOString().split('T')[0];

    await db.query(
      `INSERT INTO t_pointage (fk_utilisateur, date_pointage, heure_entree, heure_sortie, duree_minutes) 
       VALUES (?, ?, ?, ?, ?)`,
      [fk_utilisateur, dateRef, heure_entree, heure_sortie || null, duree_minutes]
    );

    return NextResponse.json({ message: "Pointage créé avec succès" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { pk_pointage, heure_entree, heure_sortie } = body;

    if (!pk_pointage || !heure_entree) {
      return NextResponse.json({ message: "ID pointage et heure d'entrée requis" }, { status: 400 });
    }

    // Recalcul de la durée
    let duree_minutes = null;
    if (heure_sortie) {
      const start = new Date(heure_entree).getTime();
      const end = new Date(heure_sortie).getTime();
      duree_minutes = Math.round((end - start) / 60000);
    }

    await db.query(
      `UPDATE t_pointage 
       SET heure_entree = ?, heure_sortie = ?, duree_minutes = ? 
       WHERE pk_pointage = ?`,
      [heure_entree, heure_sortie || null, duree_minutes, pk_pointage]
    );

    return NextResponse.json({ message: "Pointage mis à jour avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID pointage manquant" }, { status: 400 });
  }

  try {
    await db.query("DELETE FROM t_pointage WHERE pk_pointage = ?", [id]);
    return NextResponse.json({ message: "Pointage supprimé avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
