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
  const fk_utilisateur = searchParams.get("fk_utilisateur");
  const fk_porte = searchParams.get("fk_porte");
  const event_type = searchParams.get("event_type");
  const date_start = searchParams.get("date_start");
  const date_end = searchParams.get("date_end");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = `
      SELECT l.*, u.prenom, u.nom, p.titre as nom_porte 
      FROM t_logs l
      LEFT JOIN t_utilisateur u ON l.fk_utilisateur = u.pk_utilisateur
      LEFT JOIN t_porte p ON l.fk_porte = p.pk_porte
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fk_utilisateur) {
      query += " AND l.fk_utilisateur = ?";
      params.push(fk_utilisateur);
    }

    if (fk_porte) {
      query += " AND l.fk_porte = ?";
      params.push(fk_porte);
    }

    if (event_type) {
      query += " AND l.event_type = ?";
      params.push(event_type);
    }

    if (date_start) {
      query += " AND l.date_action >= ?";
      params.push(date_start);
    }

    if (date_end) {
      // Ajoute 23:59:59 si seule la date est fournie pour inclure toute la journée
      const endDate = date_end.includes(" ") ? date_end : `${date_end} 23:59:59`;
      query += " AND l.date_action <= ?";
      params.push(endDate);
    }

    query += " ORDER BY l.date_action DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [logs] = await db.query(query, params) as any;
    
    // Compter le total pour la pagination
    let countQuery = `SELECT COUNT(*) as total FROM t_logs l WHERE 1=1`;
    const countParams = params.slice(0, -2); // Enlever limit et offset
    
    if (fk_utilisateur) countQuery += " AND l.fk_utilisateur = ?";
    if (fk_porte) countQuery += " AND l.fk_porte = ?";
    if (event_type) countQuery += " AND l.event_type = ?";
    if (date_start) countQuery += " AND l.date_action >= ?";
    if (date_end) {
        const endDate = date_end.includes(" ") ? date_end : `${date_end} 23:59:59`;
        countQuery += " AND l.date_action <= ?";
    }

    const [countResult] = await db.query(countQuery, countParams) as any;
    const total = countResult[0].total;

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
