import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/auth";

// Helper pour vérifier si l'utilisateur est admin
async function isAdmin() {
  const session = await getSession();
  if (!session || typeof session !== "object" || !("user" in session)) return false;
  const user = (session as any).user;
  return user.fk_role === 1;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const [users] = (await db.query(
        "SELECT pk_utilisateur, email, prenom, nom, id_badge, date_creation, taux_horaire, fk_role FROM t_utilisateur WHERE pk_utilisateur = ?",
        [id]
      )) as any;
      if (!users.length) {
        return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
      }
      return NextResponse.json(users[0]);
    }

    const [users] = (await db.query("SELECT * FROM t_utilisateur")) as any;
    return NextResponse.json(users);
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
    const { email, prenom, nom, password, id_badge, taux_horaire, fk_role } = body;

    if (!email || !prenom || !nom || !password || !id_badge) {
      return NextResponse.json({ message: "Champs requis manquants" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await db.query(
      `INSERT INTO t_utilisateur (email, prenom, nom, password, id_badge, taux_horaire, fk_role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, prenom, nom, hashedPassword, id_badge, taux_horaire || 0, fk_role || null]
    );

    return NextResponse.json({ message: "Utilisateur créé avec succès" }, { status: 201 });
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
    const { pk_utilisateur, email, prenom, nom, password, id_badge, taux_horaire, fk_role } = body;

    if (!pk_utilisateur) {
      return NextResponse.json({ message: "ID utilisateur manquant" }, { status: 400 });
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      await db.query(
        `UPDATE t_utilisateur 
         SET email = ?, prenom = ?, nom = ?, password = ?, id_badge = ?, taux_horaire = ?, fk_role = ?
         WHERE pk_utilisateur = ?`,
        [email, prenom, nom, hashedPassword, id_badge, taux_horaire, fk_role, pk_utilisateur]
      );
    } else {
      await db.query(
        `UPDATE t_utilisateur 
         SET email = ?, prenom = ?, nom = ?, id_badge = ?, taux_horaire = ?, fk_role = ?
         WHERE pk_utilisateur = ?`,
        [email, prenom, nom, id_badge, taux_horaire, fk_role, pk_utilisateur]
      );
    }

    // Si un rôle est défini, supprimer les accès directs aux portes qui sont déjà couvertes par ce rôle
    if (fk_role) {
      await db.query(
        `DELETE FROM tr_utilisateur_porte 
         WHERE fk_utilisateur = ? 
         AND fk_porte IN (
            SELECT fk_porte FROM tr_role_porte WHERE fk_role = ?
         )`,
        [pk_utilisateur, fk_role]
      );
    }

    return NextResponse.json({ message: "Utilisateur mis à jour avec succès" });
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
    return NextResponse.json({ message: "ID utilisateur manquant" }, { status: 400 });
  }

  try {
    await db.query("DELETE FROM t_utilisateur WHERE pk_utilisateur = ?", [id]);
    return NextResponse.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}