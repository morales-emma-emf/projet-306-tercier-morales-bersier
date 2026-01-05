import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Helper pour vérifier si l'utilisateur est admin
async function isAdmin() {
  const session = await getSession();
  if (!session || typeof session !== "object" || !("user" in session)) return false;
  const user = (session as any).user;
  return user.fk_role === 1;
}

export async function GET(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fk_role = searchParams.get("roleid");
  const fk_porte = searchParams.get("porteid");

  try {
    let query = `
      SELECT tr.*, r.nom_role, p.titre as nom_porte 
      FROM tr_role_porte tr
      JOIN t_role r ON tr.fk_role = r.pk_role
      JOIN t_porte p ON tr.fk_porte = p.pk_porte
    `;
    const params: any[] = [];

    if (fk_role) {
      query += " WHERE tr.fk_role = ?";
      params.push(fk_role);
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
    const { fk_role, fk_porte } = body;

    if (!fk_role || !fk_porte) {
      return NextResponse.json({ message: "fk_role et fk_porte sont requis" }, { status: 400 });
    }

    await db.query(
      "INSERT IGNORE INTO tr_role_porte (fk_role, fk_porte) VALUES (?, ?)",
      [fk_role, fk_porte]
    );

    return NextResponse.json({ message: "Liaison créée avec succès" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fk_role = searchParams.get("fk_role");
  const fk_porte = searchParams.get("fk_porte");

  if (!fk_role || !fk_porte) {
    return NextResponse.json({ message: "fk_role et fk_porte sont requis" }, { status: 400 });
  }

  try {
    await db.query(
      "DELETE FROM tr_role_porte WHERE fk_role = ? AND fk_porte = ?",
      [fk_role, fk_porte]
    );
    return NextResponse.json({ message: "Liaison supprimée avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
