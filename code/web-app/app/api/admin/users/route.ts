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

    // On ne retourne que les utilisateurs actifs (non supprimés)
    // Note: La colonne est_actif doit avoir été ajoutée à la base de données.
    // Si elle n'existe pas, cette requête échouera. Assurez-vous d'avoir joué le script de migration.
    const [users] = (await db.query("SELECT * FROM t_utilisateur WHERE est_actif = 1")) as any;
    return NextResponse.json(users);
  } catch (error: any) {
    // Fallback: si la colonne est_actif n'existe pas encore, on renvoie tout
    if (error.code === 'ER_BAD_FIELD_ERROR') {
        const [users] = (await db.query("SELECT * FROM t_utilisateur")) as any;
        return NextResponse.json(users);
    }
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
    // Soft Delete : On désactive l'utilisateur et on libère email/badge pour réutilisation future
    // On renomme pour éviter les conflits UNIQUE et désactiver login/badge
    await db.query(
      `UPDATE t_utilisateur 
       SET est_actif = 0, 
           email = CONCAT('_DEL_', pk_utilisateur, '_', email), 
           id_badge = CONCAT('_DEL_', pk_utilisateur, '_', LEFT(id_badge, 30))
       WHERE pk_utilisateur = ?`, 
      [id]
    );

    // Suppression des données personelles mais conservation des logs
    await db.query("DELETE FROM t_pointage WHERE fk_utilisateur = ?", [id]);
    await db.query("DELETE FROM t_salaire WHERE fk_utilisateur = ?", [id]);
    
    return NextResponse.json({ message: "Utilisateur supprimé (archivé) avec succès" });
  } catch (error: any) {
    // Si la colonne n'existe pas, on tente le hard delete (comportement précédent mais attention aux logs)
    if (error.code === 'ER_BAD_FIELD_ERROR') {
       try {
         // Délier les logs avant suppression
         await db.query("UPDATE t_logs SET fk_utilisateur = NULL WHERE fk_utilisateur = ?", [id]);
         await db.query("DELETE FROM t_pointage WHERE fk_utilisateur = ?", [id]);
         await db.query("DELETE FROM t_salaire WHERE fk_utilisateur = ?", [id]);
         await db.query("DELETE FROM t_utilisateur WHERE pk_utilisateur = ?", [id]);
         return NextResponse.json({ message: "Utilisateur supprimé (défintivement) avec succès" });
       } catch (e: any) {
         return NextResponse.json({ error: e.message }, { status: 500 });
       }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}