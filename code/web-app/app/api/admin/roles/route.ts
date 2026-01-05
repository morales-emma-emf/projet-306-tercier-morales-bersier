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
  const id = searchParams.get("id");

  try {
    if (id) {
      const [roles] = await db.query("SELECT * FROM t_role WHERE pk_role = ?", [id]) as any;
      if (roles.length === 0) {
        return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
      }
      return NextResponse.json(roles[0]);
    } else {
      const [roles] = await db.query("SELECT * FROM t_role") as any;
      return NextResponse.json(roles);
    }
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
    const { nom_role } = body;

    if (!nom_role) {
      return NextResponse.json({ message: "Le nom du rôle est requis" }, { status: 400 });
    }

    await db.query("INSERT INTO t_role (nom_role) VALUES (?)", [nom_role]);

    return NextResponse.json({ message: "Rôle créé avec succès" }, { status: 201 });
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
    const { pk_role, nom_role } = body;

    if (!pk_role || !nom_role) {
      return NextResponse.json({ message: "ID et nom du rôle requis" }, { status: 400 });
    }

    await db.query("UPDATE t_role SET nom_role = ? WHERE pk_role = ?", [nom_role, pk_role]);

    return NextResponse.json({ message: "Rôle mis à jour avec succès" });
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
    return NextResponse.json({ message: "ID du rôle manquant" }, { status: 400 });
  }

  try {
    await db.query("DELETE FROM t_role WHERE pk_role = ?", [id]);
    return NextResponse.json({ message: "Rôle supprimé avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
