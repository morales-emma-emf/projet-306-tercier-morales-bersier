import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyHoursLogic } from "@/lib/hours";

export async function POST(req: Request) {
  try {
    const { badgeId, readerId, timestamp } = await req.json();

    // 1. Chercher l’utilisateur par badge
    const [rows] = await db.query(
      "SELECT * FROM users WHERE badge_id = ?",
      [badgeId]
    ) as any;
    
    const user = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!user) {
      await db.query(
        "INSERT INTO logs (badge_id, reader_id, status, timestamp) VALUES (?, ?, ?, ?)",
        [badgeId, readerId, "REFUSED", timestamp]
      );

      return NextResponse.json({ allowed: false, reason: "UNKNOWN_BADGE" });
    }

    // 2. Appliquer la logique d’entrée/sortie + horaires
    const { allowed, type } = await applyHoursLogic(user.id, timestamp);

    await db.query(
      "INSERT INTO logs (user_id, badge_id, reader_id, status, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, badgeId, readerId, allowed ? "ALLOWED" : "REFUSED", type, timestamp]
    );

    return NextResponse.json({
      allowed,
      type, // "IN" ou "OUT"
      user: { id: user.id, name: user.name },
    });
  } catch (error) {
    console.error("Error processing badge scan:", error);
    return NextResponse.json({ allowed: false, reason: "INTERNAL_ERROR" }, { status: 500 });
  }
}
