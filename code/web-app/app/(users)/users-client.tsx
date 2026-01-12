"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PresenceModal from "@/components/public/presence";

type SessionUser = {
    pk_utilisateur: number;
    email: string;
    prenom: string;
    nom: string;
    fk_role: number | null;
    id_badge?: string | null;
    taux_horaire?: number | string | null;
};

export default function UsersClient({ user }: { user: SessionUser }) {
    const router = useRouter();
    const [presenceOpen, setPresenceOpen] = useState(false);

    const roleLabel = useMemo(() => {
        if (Number(user.fk_role) === 1) return "Admin";
        return "Employé";
    }, [user.fk_role]);

    const fullName = useMemo(() => {
        const n = `${user.prenom ?? ""} ${user.nom ?? ""}`.trim();
        return n || user.email;
    }, [user]);

    const handleLogout = async () => {

        await fetch("/api/auth/logout", { method: "POST" }).catch(() => { });
        router.push("/login");
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
            <section className="mx-auto max-w-5xl px-6 py-12">
                <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Espace Employé</p>
                        <h1 className="text-3xl font-semibold text-white">Bienvenue, {fullName}</h1>
                        <p className="text-sm text-slate-400">Consulte tes présences et tes informations.</p>
                    </div>

                    <div className="flex gap-2">
                        {Number(user.fk_role) === 1 && (
                            <button
                                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                onClick={() => router.push("/dashboard")}
                            >
                                Aller au dashboard admin
                            </button>
                        )}

                        <button
                            className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-600 hover:text-white"
                            onClick={handleLogout}
                        >
                            Déconnexion
                        </button>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                    {/* Profil */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mon profil</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">{fullName}</h2>
                        <p className="text-sm text-slate-400">{user.email}</p>

                        <div className="mt-5 grid gap-3 text-sm text-slate-200">
                            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
                                <span className="text-slate-400">Rôle</span>
                                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-100">
                                    {roleLabel}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
                                <span className="text-slate-400">Badge</span>
                                <span className="font-semibold text-white">{(user as any).id_badge ?? "—"}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
                                <span className="text-slate-400">Taux horaire</span>
                                <span className="font-semibold text-white">
                                    {(user as any).taux_horaire ?? "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Présences */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Présences</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">Mon planning</h2>
                        <p className="text-sm text-slate-400">
                            Tableau présence
                        </p>

                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                onClick={() => setPresenceOpen(true)}>
                                Voir mes présences
                            </button>

                        </div>
                    </div>
                </div>
            </section>


            <PresenceModal
                open={presenceOpen}
                onClose={() => setPresenceOpen(false)}
                userId={user.pk_utilisateur}
                title="Planning de présence"
                canAddPointage={Number(user.fk_role) === 1}
            />

        </main>
    );
}

