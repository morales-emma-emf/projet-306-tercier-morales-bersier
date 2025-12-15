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
    const [portes] = await db.query("SELECT * FROM t_porte") as any;
    
    const [userDoors] = await db.query(`
      SELECT tr.*, u.prenom, u.nom, p.titre 
      FROM tr_utilisateur_porte tr
      JOIN t_utilisateur u ON tr.fk_utilisateur = u.pk_utilisateur
      JOIN t_porte p ON tr.fk_porte = p.pk_porte
    `) as any;

    const [roleDoors] = await db.query(`
      SELECT tr.*, r.nom_role, p.titre 
      FROM tr_role_porte tr
      JOIN t_role r ON tr.fk_role = r.pk_role
      JOIN t_porte p ON tr.fk_porte = p.pk_porte
    `) as any;

    const [pointages] = await db.query(`
      SELECT p.*, u.nom, u.prenom 
      FROM t_pointage p 
      JOIN t_utilisateur u ON p.fk_utilisateur = u.pk_utilisateur 
      ORDER BY p.date_pointage DESC 
      LIMIT 50
    `) as any;

    const [logs] = await db.query(`
      SELECT l.*, u.nom, u.prenom, p.titre as porte_titre
      FROM t_logs l
      LEFT JOIN t_utilisateur u ON l.fk_utilisateur = u.pk_utilisateur
      LEFT JOIN t_porte p ON l.fk_porte = p.pk_porte
      ORDER BY l.date_action DESC
      LIMIT 50
    `) as any;

    return NextResponse.json({ users, roles, portes, userDoors, roleDoors, pointages, logs });
  } catch (error) {
    console.error("Dev API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "door") {
      const { titre, pk_porte } = body;
      if (!titre) return NextResponse.json({ error: "Missing titre" }, { status: 400 });
      
      if (pk_porte) {
        await db.query("INSERT INTO t_porte (pk_porte, titre) VALUES (?, ?)", [pk_porte, titre]);
      } else {
        await db.query("INSERT INTO t_porte (titre) VALUES (?)", [titre]);
      }
      return NextResponse.json({ success: true });
    }

    if (type === "role") {
      const { nom_role } = body;
      if (!nom_role) return NextResponse.json({ error: "Missing nom_role" }, { status: 400 });
      await db.query("INSERT INTO t_role (nom_role) VALUES (?)", [nom_role]);
      return NextResponse.json({ success: true });
    }

    if (type === "user_door") {
      const { fk_utilisateur, fk_porte } = body;
      if (!fk_utilisateur || !fk_porte) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
      await db.query("INSERT IGNORE INTO tr_utilisateur_porte (fk_utilisateur, fk_porte) VALUES (?, ?)", [fk_utilisateur, fk_porte]);
      return NextResponse.json({ success: true });
    }

    if (type === "role_door") {
      const { fk_role, fk_porte } = body;
      if (!fk_role || !fk_porte) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
      await db.query("INSERT IGNORE INTO tr_role_porte (fk_role, fk_porte) VALUES (?, ?)", [fk_role, fk_porte]);
      return NextResponse.json({ success: true });
    }

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
