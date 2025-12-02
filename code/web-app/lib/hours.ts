import { db } from "@/lib/db";

export async function applyHoursLogic(userId: number, timestamp: string) {
  // 1. Récupérer le dernier log ALLOWED de ce user
  // Note: This is a simplified logic based on the cheat sheet.
  // In a real app, you'd check the date, open sessions, etc.
  
  const [rows] = await db.query(
    "SELECT * FROM logs WHERE user_id = ? AND status = 'ALLOWED' ORDER BY timestamp DESC LIMIT 1",
    [userId]
  ) as any;

  const lastLog = rows.length > 0 ? rows[0] : null;

  let type = "IN";
  
  if (lastLog && lastLog.type === "IN") {
      // If the last action was IN, then this is an OUT
      type = "OUT";
  } else {
      // If no logs or last was OUT, then this is an IN
      type = "IN";
  }

  // 5. Vérifier les règles min/max, surplus, etc. (Placeholder)
  // Ici on pourrait vérifier si l'heure est dans les plages autorisées
  const allowed = true; 

  return {
    allowed,
    type
  };
}
