"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LogItem = {
  pk_log: number;
  action: string;
  event_type: "access" | "warning" | "error" | string;
  date_action: string;
  fk_utilisateur: number | null;
  fk_porte: number | null;
  prenom: string | null;
  nom: string | null;
  nom_porte: string | null;
};

type User = {
  pk_utilisateur: number;
  prenom: string;
  nom: string;
};

type Porte = {
  pk_porte: number;
  titre: string;
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
};

const EVENT_LABEL: Record<string, string> = {
  access: "Accès",
  warning: "Alerte",
  error: "Erreur",
};

function formatDateForDisplay(value: string) {
  const date = new Date(value);
  return date.toLocaleString("fr-CH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeDateInput(value: string) {
  if (!value) return "";
  // datetime-local returns YYYY-MM-DDTHH:mm
  if (value.includes("T") && value.length === 16) {
    return value.replace("T", " ") + ":00";
  }
  return value;
}

export default function AdminLogsPage() {
  const router = useRouter();

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [portes, setPortes] = useState<Porte[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedPorte, setSelectedPorte] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }).then((res) => res.json()),
      fetch("/api/admin/portes", { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([usersData, portesData]) => {
        if (!active) return;
        setUsers(usersData || []);
        setPortes(portesData || []);
      })
      .catch(() => {
        if (!active) return;
        setError("Impossible de charger les filtres");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String((page - 1) * limit));
    if (selectedUser) params.set("fk_utilisateur", selectedUser);
    if (selectedPorte) params.set("fk_porte", selectedPorte);
    if (eventType) params.set("event_type", eventType);
    if (dateStart) params.set("date_start", normalizeDateInput(dateStart));
    if (dateEnd) params.set("date_end", normalizeDateInput(dateEnd));

    fetch(`/api/admin/logs?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Erreur lors du chargement des logs");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setLogs(data.data || []);
        setPagination(data.pagination || null);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err.message || "Erreur lors du chargement des logs");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedUser, selectedPorte, eventType, dateStart, dateEnd, limit, page]);

  const totalLabel = useMemo(() => {
    if (!pagination) return "";
    if (pagination.total === 0) return "0 / 0";
    const start = pagination.offset + 1;
    const end = Math.min(pagination.offset + pagination.limit, pagination.total);
    return `${start}–${end} / ${pagination.total}`;
  }, [pagination]);

  const badgeClass = (type: string) => {
    if (type === "warning") return "bg-amber-500/15 text-amber-200 border border-amber-400/30";
    if (type === "error") return "bg-rose-500/15 text-rose-200 border border-rose-400/30";
    return "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30";
  };

  const resetFilters = () => {
    setSelectedUser("");
    setSelectedPorte("");
    setEventType("");
    setDateStart("");
    setDateEnd("");
    setPage(1);
  };

  const canPrev = page > 1;
  const canNext = pagination ? page < pagination.totalPages : false;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Administration</p>
            <h1 className="text-3xl font-semibold text-white">Gestion des logs</h1>
            <p className="text-sm text-slate-400">Filtrez par utilisateur, porte, type d'événement et période.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
              onClick={() => router.push("/dashboard")}
            >
              Retour au tableau de bord
            </button>
          </div>
        </header>

        <div className="mb-6 grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-black/30 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Utilisateur</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
            >
              <option value="">Tous</option>
              {users.map((u) => (
                <option key={u.pk_utilisateur} value={u.pk_utilisateur}>
                  {u.prenom} {u.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Porte</label>
            <select
              value={selectedPorte}
              onChange={(e) => {
                setSelectedPorte(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
            >
              <option value="">Toutes</option>
              {portes.map((p) => (
                <option key={p.pk_porte} value={p.pk_porte}>
                  {p.titre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Type d'événement</label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
            >
              <option value="">Tous</option>
              <option value="access">Accès</option>
              <option value="warning">Alerte</option>
              <option value="error">Erreur</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Date début</label>
            <input
              type="datetime-local"
              value={dateStart}
              onChange={(e) => {
                setDateStart(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Date fin</label>
            <input
              type="datetime-local"
              value={dateEnd}
              onChange={(e) => {
                setDateEnd(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
            />
          </div>

          <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Résultats par page</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400"
              >
                {[25, 50, 100].map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="h-fit rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
          <div className="grid grid-cols-[160px_180px_170px_1fr] items-center bg-slate-800/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            <span>Date</span>
            <span>Utilisateur</span>
            <span>Porte</span>
            <span>Événement</span>
          </div>

          {loading && <div className="p-6 text-sm text-slate-400">Chargement des logs…</div>}
          {error && !loading && <div className="p-6 text-sm text-red-300">{error}</div>}
          {!loading && !error && logs.length === 0 && (
            <div className="p-6 text-sm text-slate-400">Aucun log pour ces filtres.</div>
          )}

          <ul className="divide-y divide-slate-800">
            {!loading && !error && logs.map((log) => (
              <li key={log.pk_log} className="grid grid-cols-[160px_180px_170px_1fr] gap-3 px-4 py-4 text-sm text-slate-200 hover:bg-slate-800/40">
                <div className="text-slate-200">{formatDateForDisplay(log.date_action)}</div>
                <div>
                  {log.prenom && log.nom ? (
                    <p className="font-semibold text-white">{log.prenom} {log.nom}</p>
                  ) : (
                    <p className="text-slate-400">Inconnu</p>
                  )}
                  {log.fk_utilisateur ? (
                    <p className="text-xs text-slate-400">ID: {log.fk_utilisateur}</p>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-white">{log.nom_porte || "—"}</p>
                  {log.fk_porte ? (
                    <p className="text-xs text-slate-400">Porte #{log.fk_porte}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(log.event_type)}`}>
                    {EVENT_LABEL[log.event_type] || log.event_type}
                  </div>
                  <p className="text-slate-200">{log.action}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">{pagination ? `Page ${pagination.page} / ${pagination.totalPages}` : ""}</div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400">{totalLabel}</div>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
              >
                Précédent
              </button>
              <button
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((p) => (canNext ? p + 1 : p))}
                disabled={!canNext}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
