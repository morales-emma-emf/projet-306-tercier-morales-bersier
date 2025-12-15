import { cookies } from "next/headers";
import { signToken, verifyToken } from "./jwt";

export async function login(userData: any) {
  // Créer la session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
  const session = await signToken({ user: userData, expires });

  // Sauvegarder dans les cookies
  cookies().set("session", session, { expires, httpOnly: true });
}

export async function logout() {
  // Détruire la session
  cookies().set("session", "", { expires: new Date(0) });
}

export async function decrypt(token: string) {
    return await verifyToken(token);
}

export async function getSession() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  return await verifyToken(session);
}
