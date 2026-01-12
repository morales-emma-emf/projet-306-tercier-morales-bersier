import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/auth";
import UsersClient from "../../(users)/users-client";

export default async function UsersPage() {
  const cookie = (await cookies()).get("session");
  const payload = cookie ? await decrypt(cookie.value) : null;

  const user = (payload as any)?.user;
  if (!user) redirect("/login");

  return <UsersClient user={user} />;
}
