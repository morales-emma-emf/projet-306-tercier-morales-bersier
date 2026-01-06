import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Convertit une date (datetime-local OU ISO) en "YYYY-MM-DD HH:mm:ss"
 * en heure LOCALE (adapté à MySQL DATETIME).
 */
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

    // ✅ format MySQL DATETIME
    const heure_entree = toMysqlDatetime(String(heure_entree_raw));
    const heure_sortie = heure_sortie_raw ? toMysqlDatetime(String(heure_sortie_raw)) : null;

    // ✅ Vérif sortie >= entrée (si fournie)
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

    // ✅ pour ta table: date_pointage est DATETIME NOT NULL
    // -> on met la même valeur que heure_entree (simple + cohérent)
    const date_pointage = heure_entree;

    const duree_minutes =
      heure_sortie_raw ? diffMinutes(String(heure_entree_raw), String(heure_sortie_raw)) : null;

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
