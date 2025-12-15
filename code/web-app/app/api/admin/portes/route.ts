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
  const id = searchParams.get("id");

  try {
    if (id) {
      const [portes] = await db.query("SELECT * FROM t_porte WHERE pk_porte = ?", [id]) as any;
      if (portes.length === 0) {
        return NextResponse.json({ message: "Porte non trouvée" }, { status: 404 });
      }
      return NextResponse.json(portes[0]);
    } else {
      const [portes] = await db.query("SELECT * FROM t_porte") as any;
      return NextResponse.json(portes);
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
    const { pk_porte, titre, description } = body;

    if (!titre) {
      return NextResponse.json({ message: "Le titre est requis" }, { status: 400 });
    }

    if (pk_porte) {
        // Insertion avec ID spécifique (utile si on veut définir l'ID du lecteur physique)
        await db.query(
            "INSERT INTO t_porte (pk_porte, titre, description) VALUES (?, ?, ?)",
            [pk_porte, titre, description || null]
        );
    } else {
        // Insertion standard
        await db.query(
            "INSERT INTO t_porte (titre, description) VALUES (?, ?)",
            [titre, description || null]
        );
    }

    return NextResponse.json({ message: "Porte créée avec succès" }, { status: 201 });
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
    const { pk_porte, titre, description } = body;

    if (!pk_porte) {
      return NextResponse.json({ message: "ID de porte manquant" }, { status: 400 });
    }

    await db.query(
      "UPDATE t_porte SET titre = ?, description = ? WHERE pk_porte = ?",
      [titre, description || null, pk_porte]
    );

    return NextResponse.json({ message: "Porte mise à jour avec succès" });
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
    return NextResponse.json({ message: "ID de porte manquant" }, { status: 400 });
  }

  try {
    await db.query("DELETE FROM t_porte WHERE pk_porte = ?", [id]);
    return NextResponse.json({ message: "Porte supprimée avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
