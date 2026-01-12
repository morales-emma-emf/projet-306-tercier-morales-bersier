"use client";

import { useEffect, useMemo, useState } from "react";

type PresenceEvent = {
  id: number;
  start: string;
  end: string;
  label?: string;
  is_incomplete?: boolean;
  user?: { prenom: string; nom: string };
  end_is_auto?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  title?: string;
  canAddPointage?: boolean;
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function default19hLocalInput(startIso: string) {

  const d = new Date(startIso);
  const x = new Date(d);
  x.setHours(20, 0, 0, 0);

  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  const hh = String(x.getHours()).padStart(2, "0");
  const mi = String(x.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function PresenceModal({ open, onClose, userId, title, canAddPointage }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PresenceEvent[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  
  const [savingId, setSavingId] = useState<number | null>(null);
  const [sortieDraft, setSortieDraft] = useState<Record<number, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ heure_entree: "", heure_sortie: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);


 
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const weekStart = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return startOfWeek(base);
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekLabel = useMemo(() => {
    const a = weekStart.toLocaleDateString("fr-CH");
    const b = weekEnd.toLocaleDateString("fr-CH");
    return `${a} - ${b}`;
  }, [weekStart, weekEnd]);

  const loadPresences = async (signal?: AbortSignal) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const qs = new URLSearchParams({
        userid: String(userId),
        start_date: weekStart.toISOString(),
        end_date: addDays(weekEnd, 1).toISOString(),
      });

      const res = await fetch(`/api/presences?${qs.toString()}`, {
        cache: "no-store",
        signal,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const list = Array.isArray(data?.events) ? data.events : [];
      setEvents(list);

     
      setSortieDraft((prev) => {
        const next = { ...prev };
        for (const evt of list) {
          if (evt?.is_incomplete && !next[evt.id]) {
            next[evt.id] = default19hLocalInput(evt.start);
          }
        }
        return next;
      });
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "Erreur chargement présences");
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
    if (!open || !userId) return;

    const controller = new AbortController();
    loadPresences(controller.signal);

    return () => controller.abort();
   
  }, [open, userId, weekStart, weekEnd]);

  if (!open) return null;

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const startHour = 7;
  const endHour = 20;

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const eventToGridStyle = (evt: PresenceEvent) => {
    const s = new Date(evt.start);
    const e = new Date(evt.end);

    const dayIndex = clamp((s.getDay() + 6) % 7, 0, 5);
    const gridStart = startHour * 60;
    const gridEnd = endHour * 60;

    const sm = s.getHours() * 60 + s.getMinutes();
    const em = e.getHours() * 60 + e.getMinutes();

    const topPct = ((clamp(sm, gridStart, gridEnd) - gridStart) / (gridEnd - gridStart)) * 100;
    const heightPct =
      ((clamp(em, gridStart, gridEnd) - clamp(sm, gridStart, gridEnd)) / (gridEnd - gridStart)) * 100;

    return { dayIndex, topPct, heightPct: Math.max(heightPct, 4) };
  };

  const incompletes = events.filter((e) => e.is_incomplete);

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* modal */}
      <div className="relative mx-auto mt-6 w-[95%] max-w-6xl max-h-[90vh] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col">
        {/* header modal */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Présences</p>
            <h3 className="text-xl font-semibold text-white">{title ?? "Planning de présence"}</h3>
            <p className="text-sm text-slate-400">{weekLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              ◀
            </button>
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              onClick={() => setWeekOffset(0)}
            >
              Semaine actuelle
            </button>
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              ▶
            </button>

            <button
              className="ml-2 rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>

        {/* contenu */}
        <div className="p-6 overflow-y-auto flex-1">

          {loading && <p className="text-sm text-slate-400">Chargement…</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          {!loading && !error && (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60">

                <div className="overflow-x-auto">

                  <div className="min-w-[1100px]">

                    <div className="sticky top-0 z-10 grid grid-cols-[90px_repeat(6,1fr)] bg-slate-800/90 backdrop-blur text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                      <div className="px-4 py-3">Heure</div>
                      {days.map((d) => (
                        <div key={d} className="px-4 py-3">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* grid */}
                    <div className="relative">
                      {hours.map((h) => (
                        <div key={h} className="grid grid-cols-[90px_repeat(6,1fr)] border-t border-slate-800">
                          <div className="px-4 py-3 text-sm text-slate-300">
                            {String(h).padStart(2, "0")}:00
                          </div>

                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="px-3 py-2">
                              <div className="h-10 rounded-xl border border-slate-800 bg-slate-950/40" />
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* blocs */}
                      <div className="absolute left-[90px] top-0 right-0 bottom-0 pointer-events-none">
                        {events.map((evt) => {
                          const { dayIndex, topPct, heightPct } = eventToGridStyle(evt);
                          const left = `${(dayIndex / 6) * 100}%`;
                          const width = `${(1 / 6) * 100}%`;

                          return (
                            <div
                              key={evt.id}
                              style={{
                                position: "absolute",
                                left,
                                width,
                                top: `${topPct}%`,
                                height: `${heightPct}%`,
                                padding: "8px",
                              }}
                            >
                              <div
                                className={[
                                  "h-full w-full rounded-2xl border px-3 py-2 text-xs shadow-lg",
                                  evt.is_incomplete
                                    ? "border-amber-300/40 bg-amber-500/15 text-amber-100 shadow-amber-500/10"
                                    : "border-indigo-400/40 bg-indigo-500/20 text-indigo-100 shadow-indigo-500/10",
                                ].join(" ")}
                              >
                                <div className="font-semibold">
                                  {evt.label ?? (evt.is_incomplete ? "Sortie manquante" : "Présence")}
                                </div>
                                <div className="text-[11px] text-slate-200/80">
                                  {new Date(evt.start).toLocaleTimeString("fr-CH", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {new Date(evt.end).toLocaleTimeString("fr-CH", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {evt.is_incomplete && (
                                    <span className="ml-2 text-[10px] text-amber-200/80">(auto 19:00)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {events.length === 0 && (
                      <div className="p-4 text-sm text-slate-400">Aucune présence sur cette semaine.</div>
                    )}
                  </div>
                </div>
              </div>


             
              {canAddPointage && (
                <div className="mt-4 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-4">
                  <p className="text-sm font-semibold text-indigo-100">Ajouter un pointage (admin)</p>
                  <p className="text-xs text-indigo-200/70 mb-3">
                    Ajoute une entrée (obligatoire) et une sortie (optionnel).
                  </p>

                  {addError && <p className="mb-2 text-xs text-red-300">{addError}</p>}
                  {addSuccess && <p className="mb-2 text-xs text-emerald-300">{addSuccess}</p>}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Heure d'entrée *</label>
                      <input
                        type="datetime-local"
                        value={addForm.heure_entree}
                        onChange={(e) => setAddForm((p) => ({ ...p, heure_entree: e.target.value }))}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-300">Heure de sortie (optionnel)</label>
                      <input
                        type="datetime-local"
                        value={addForm.heure_sortie}
                        onChange={(e) => setAddForm((p) => ({ ...p, heure_sortie: e.target.value }))}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
                      onClick={() => {
                        setAddForm({ heure_entree: "", heure_sortie: "" });
                        setAddError(null);
                        setAddSuccess(null);
                      }}
                      disabled={addSaving}
                    >
                      Réinitialiser
                    </button>

                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      disabled={addSaving}
                      onClick={async () => {
                        setAddError(null);
                        setAddSuccess(null);

                        if (!addForm.heure_entree) {
                          setAddError("L'heure d'entrée est obligatoire.");
                          return;
                        }

                        setAddSaving(true);
                        try {
                          const payload = {
                            fk_utilisateur: userId,
                            heure_entree: new Date(addForm.heure_entree).toISOString(),
                            heure_sortie: addForm.heure_sortie ? new Date(addForm.heure_sortie).toISOString() : null,
                          };

                          const res = await fetch("/api/admin/pointage", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });

                          if (!res.ok) throw new Error(await res.text());

                          setAddSuccess("Pointage ajouté ");
                          setAddForm({ heure_entree: "", heure_sortie: "" });

                          await loadPresences();
                        } catch (e: any) {
                          setAddError(e?.message || "Erreur lors de l'ajout du pointage");
                        } finally {
                          setAddSaving(false);
                        }
                      }}
                    >
                      {addSaving ? "Ajout…" : "Ajouter"}
                    </button>
                  </div>
                </div>
              )}

          
              {incompletes.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-semibold text-amber-100">Sorties manquantes</p>
                  <p className="text-xs text-amber-200/70 mb-3">
                    Fin de journée fixée à <b>19:00</b> par défaut. Complète si tu as oublié de badger.
                  </p>

                  {successMsg && <p className="mb-2 text-xs text-emerald-300">{successMsg}</p>}

                  <div className="space-y-3">
                    {incompletes.map((evt) => {
                      const current = sortieDraft[evt.id] ?? default19hLocalInput(evt.start);

                      return (
                        <div
                          key={evt.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="text-sm">
                            <div className="font-semibold text-white">
                              {evt.user ? `${evt.user.prenom} ${evt.user.nom}` : "Moi"}
                            </div>
                            <div className="text-xs text-slate-400">
                              Entrée : {new Date(evt.start).toLocaleString("fr-CH")}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="datetime-local"
                              value={current}
                              onChange={(e) => setSortieDraft((p) => ({ ...p, [evt.id]: e.target.value }))}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"
                            />

                            <button
                              disabled={savingId === evt.id}
                              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
                              onClick={async () => {
                                setSavingId(evt.id);
                                setError(null);
                                setSuccessMsg(null);

                                try {
                                  const chosen = sortieDraft[evt.id] ?? current;

                                  const res = await fetch("/api/pointage/complete", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      pointage_id: evt.id,
                                      heure_sortie: new Date(chosen).toISOString(),
                                    }),
                                  });

                                  if (!res.ok) throw new Error(await res.text());

                                  setSuccessMsg("Sortie enregistrée ");
                                  await loadPresences();
                                } catch (e: any) {
                                  setError(e?.message || "Erreur");
                                } finally {
                                  setSavingId(null);
                                }
                              }}
                            >
                              {savingId === evt.id ? "Enregistrement…" : "Compléter"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
