"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(e: any) {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Erreur de connexion");
      return;
    }

    if (Number(data.user.fk_role) === 1) {
      router.push("/dashboard");
    } else {
      alert("Accès réservé aux administrateurs");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#1f2933,#111827)] text-white">
      <section className="w-full max-w-[420px] bg-[#1f2933] px-10 py-9 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
  
        <h1 className="text-center text-2xl font-bold mb-2">
          Connexion Admin
        </h1>
  
        <p className="text-center text-sm text-[#94a3b8] mb-8">
          Accès au portail de gestion
        </p>
  
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
  
          {/* Email */}
          <div className="flex flex-col">
            <label className="text-sm text-[#cbd5e1] mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="admin@entreprise.ch"
              required
              className="px-3 py-2 rounded-md bg-[#0f172a] text-white text-sm placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
  
          {/* Password */}
          <div className="flex flex-col">
            <label className="text-sm text-[#cbd5e1] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="px-3 py-2 rounded-md bg-[#0f172a] text-white text-sm placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
  
          {/* Button */}
          <button
            type="submit"
            className="mt-4 w-full py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition"
          >
            Se connecter
          </button>
        </form>
  
        <p className="text-center text-xs text-[#94a3b8] mt-6">
          Badge system · Projet scolaire
        </p>
      </section>
    </main>
  );
  
  
}  