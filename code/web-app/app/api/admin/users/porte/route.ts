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
  const fk_porte = searchParams.get("porteid");

  try {
    let query = `
      SELECT tr.*, u.prenom, u.nom, p.titre as nom_porte 
      FROM tr_utilisateur_porte tr
      JOIN t_utilisateur u ON tr.fk_utilisateur = u.pk_utilisateur
      JOIN t_porte p ON tr.fk_porte = p.pk_porte
    `;
    const params: any[] = [];

    if (fk_utilisateur) {
      query += " WHERE tr.fk_utilisateur = ?";
      params.push(fk_utilisateur);
    } else if (fk_porte) {
      query += " WHERE tr.fk_porte = ?";
      params.push(fk_porte);
    }

    const [relations] = await db.query(query, params) as any;
    return NextResponse.json(relations);
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
    const { fk_utilisateur, fk_porte } = body;

    if (!fk_utilisateur || !fk_porte) {
      return NextResponse.json({ message: "fk_utilisateur et fk_porte sont requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà accès via son rôle
    const [roleAccess] = await db.query(
      `SELECT 1
       FROM t_utilisateur u
       JOIN tr_role_porte rp ON u.fk_role = rp.fk_role
       WHERE u.pk_utilisateur = ? AND rp.fk_porte = ?`,
      [fk_utilisateur, fk_porte]
    ) as any;

    if (roleAccess.length > 0) {
      return NextResponse.json({ 
        message: "L'utilisateur a déjà accès à cette porte via son rôle. Liaison directe ignorée.",
        ignored: true 
      }, { status: 200 });
    }

    await db.query(
      "INSERT IGNORE INTO tr_utilisateur_porte (fk_utilisateur, fk_porte) VALUES (?, ?)",
      [fk_utilisateur, fk_porte]
    );

    return NextResponse.json({ message: "Liaison créée avec succès", ignored: false }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fk_utilisateur = searchParams.get("userid");
  const fk_porte = searchParams.get("porteid");

  if (!fk_utilisateur || !fk_porte) {
    return NextResponse.json({ message: "fk_utilisateur et fk_porte sont requis" }, { status: 400 });
  }

  try {
    await db.query(
      "DELETE FROM tr_utilisateur_porte WHERE fk_utilisateur = ? AND fk_porte = ?",
      [fk_utilisateur, fk_porte]
    );
    return NextResponse.json({ message: "Liaison supprimée avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
