import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { login } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Veuillez remplir tous les champs" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur et son rôle
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT u.*, r.nom_role 
       FROM t_utilisateur u 
       LEFT JOIN t_role r ON u.fk_role = r.pk_role 
       WHERE u.email = ?`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    // Note: Assurez-vous que les mots de passe dans la BDD sont hachés avec bcrypt
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Créer la session
    const userData = {
      id: user.pk_utilisateur,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      pk_role: user.fk_role,
      role: user.nom_role,
    };

    await login(userData);

    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
