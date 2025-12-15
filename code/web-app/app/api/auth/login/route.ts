import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email ou mot de passe manquant" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT * FROM t_utilisateur WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    const user = rows[0];

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // ✅ LOGIN OK (sans session pour l’école)
    return NextResponse.json({
      success: true,
      user: {
        pk_utilisateur: user.pk_utilisateur,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        fk_role: user.fk_role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
