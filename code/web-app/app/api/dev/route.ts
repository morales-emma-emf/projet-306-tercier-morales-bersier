import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [users] = await db.query(`
      SELECT u.*, r.nom_role 
      FROM t_utilisateur u 
      LEFT JOIN t_role r ON u.fk_role = r.pk_role
      ORDER BY u.pk_utilisateur DESC
    `) as any;

    const [roles] = await db.query("SELECT * FROM t_role") as any;

    const [pointages] = await db.query(`
      SELECT p.*, u.nom, u.prenom 
      FROM t_pointage p 
      JOIN t_utilisateur u ON p.fk_utilisateur = u.pk_utilisateur 
      ORDER BY p.date_pointage DESC 
      LIMIT 50
    `) as any;

    return NextResponse.json({ users, roles, pointages });
  } catch (error) {
    console.error("Dev API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prenom, nom, password, id_badge, taux_horaire, fk_role } = body;

    // Basic validation
    if (!prenom || !nom || !id_badge) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO t_utilisateur (prenom, nom, password, id_badge, taux_horaire, fk_role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [prenom, nom, password || "1234", id_badge, taux_horaire || 0, fk_role || null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Dev API Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { pk_utilisateur, prenom, nom, password, id_badge, taux_horaire, fk_role } = body;

    if (!pk_utilisateur) {
      return NextResponse.json({ error: "Missing pk_utilisateur" }, { status: 400 });
    }

    // Build dynamic query or just update all fields for simplicity in dev
    await db.query(
      `UPDATE t_utilisateur 
       SET prenom = ?, nom = ?, password = ?, id_badge = ?, taux_horaire = ?, fk_role = ?
       WHERE pk_utilisateur = ?`,
      [prenom, nom, password, id_badge, taux_horaire, fk_role, pk_utilisateur]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Dev API Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
