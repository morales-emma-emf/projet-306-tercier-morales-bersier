import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toMysqlDatetime(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error("Date invalide");

  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function diffMinutes(startRaw: string, endRaw: string) {
  const s = new Date(startRaw).getTime();
  const e = new Date(endRaw).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  const minutes = Math.round((e - s) / 60000);
  return minutes >= 0 ? minutes : null;
}

export async function POST(req: Request) {
  try {
    
    const cookie = (await cookies()).get("session");
    const payload = cookie ? await decrypt(cookie.value) : null;
    const sessionUser = (payload as any)?.user;

    if (!sessionUser) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }
    if (Number(sessionUser.fk_role) !== 1) {
      return NextResponse.json({ message: "Admin uniquement" }, { status: 403 });
    }

    const body = await req.json();

    const fk_utilisateur = Number(body?.fk_utilisateur);
    if (!fk_utilisateur || Number.isNaN(fk_utilisateur)) {
      return NextResponse.json({ message: "fk_utilisateur invalide" }, { status: 400 });
    }

    const heure_entree_raw = body?.heure_entree;
    const heure_sortie_raw = body?.heure_sortie ?? null;

    if (!heure_entree_raw) {
      return NextResponse.json({ message: "heure_entree est obligatoire" }, { status: 400 });
    }

    const heure_entree = toMysqlDatetime(String(heure_entree_raw));
    const heure_sortie = heure_sortie_raw ? toMysqlDatetime(String(heure_sortie_raw)) : null;

    if (heure_sortie_raw) {
      const s = new Date(String(heure_entree_raw)).getTime();
      const e = new Date(String(heure_sortie_raw)).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
        return NextResponse.json(
          { message: "L'heure de sortie ne peut pas être avant l'heure d'entrée." },
          { status: 400 }
        );
      }
    }

    const date_pointage = heure_entree;
    const duree_minutes =
      heure_sortie_raw ? diffMinutes(String(heure_entree_raw), String(heure_sortie_raw)) : null;



    const day = heure_entree.slice(0, 10);
    const endFallback = `${day} 20:00:00`;

    const newStart = heure_entree;
    const newEnd = heure_sortie ?? endFallback;

    const [overlaps]: any = await db.query(
      `
  SELECT pk_pointage
  FROM t_pointage
  WHERE fk_utilisateur = ?
    AND heure_entree < ?
    AND COALESCE(heure_sortie, ?) > ?
  LIMIT 1
  `,
      [fk_utilisateur, newEnd, endFallback, newStart]
    );

    if (overlaps?.length) {
      return NextResponse.json(
        { message: "Chevauchement détecté : ce créneau se superpose à un autre pointage." },
        { status: 409 }
      );
    }

    await db.query(

      `INSERT INTO t_pointage (fk_utilisateur, date_pointage, heure_entree, heure_sortie, duree_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      [fk_utilisateur, date_pointage, heure_entree, heure_sortie, duree_minutes]
    );

    return NextResponse.json({ ok: true, message: "Pointage ajouté" });
  } catch (e: any) {
    console.error("POST /api/admin/pointage error:", e);
    return NextResponse.json({ message: e?.message || "Erreur serveur" }, { status: 500 });
  }
}
