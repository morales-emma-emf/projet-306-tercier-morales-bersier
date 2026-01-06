"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function MePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#1f2933,#111827)] text-white">Chargement...</div>;

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#1f2933,#111827)] text-white">Non connecté</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[linear-gradient(135deg,#1f2933,#111827)] text-white">
      <section className="w-full max-w-[420px] bg-[#1f2933] px-10 py-10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
        <h1 className="text-center text-3xl font-bold mb-8">Mon Profil</h1>
        
        <div className="space-y-4">
            <div>
                <label className="text-sm text-[#94a3b8]">Email</label>
                <p className="text-lg font-medium">{user.email}</p>
            </div>
            <div>
                <label className="text-sm text-[#94a3b8]">Rôle</label>
                <p className="text-lg font-medium">{Number(user.fk_role) === 1 ? 'Administrateur' : 'Utilisateur'}</p>
            </div>
        </div>

        <button 
            onClick={handleLogout}
            className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all"
        >
            Déconnexion
        </button>
      </section>
    </main>
  );
}
