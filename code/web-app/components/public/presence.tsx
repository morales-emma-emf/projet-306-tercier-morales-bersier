"use client";

import { useEffect, useMemo, useState } from "react";

type PresenceEvent = {
  id: number;
  start: string;
  end: string;
  label?: string;
  is_incomplete?: boolean;
  user?: { prenom: string; nom: string };
};

type Props = {
  open: boolean;
  onClose: () => void;
  userId: number | null; // admin: l’utilisateur sélectionné, user: son id
  title?: string;
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lundi = 0
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

export default function PresenceModal({ open, onClose, userId, title }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PresenceEvent[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  // ESC
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

  // Load
  useEffect(() => {
    if (!open || !userId) return;

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const qs = new URLSearchParams({
          userid: String(userId),
          start_date: weekStart.toISOString(),
          end_date: addDays(weekEnd, 1).toISOString(), 
        });

        const res = await fetch(`/api/presences?${qs.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setEvents(Array.isArray(data?.events) ? data.events : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "Erreur chargement présences");
      } finally {
        setLoading(false);
      }
    };

    load();
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

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* modal */}
      <div className="relative mx-auto mt-8 w-[95%] max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden">
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

        {/* content */}
        <div className="p-6">
          {loading && <p className="text-sm text-slate-400">Chargement…</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}

          {!loading && !error && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
              {/* scroll vertical + horizontal ici */}
              <div className="max-h-[calc(100vh-220px)] overflow-auto">
                <div className="min-w-[1100px]">
                  {/* header planning sticky */}
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
                            {/*  un peu moins haut */}
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
                              <div className="font-semibold">{evt.label ?? "Présence"}</div>
                              <div className="text-[11px] text-slate-200/80">
                                {new Date(evt.start).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}{" "}
                                -{" "}
                                {new Date(evt.end).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}
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
          )}
        </div>
      </div>
    </div>
  );
}
