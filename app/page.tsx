"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DayType = "week" | "weekend";
type TableType = "pool" | "heyball" | "snooker";

type TableConfig = {
  number: number;
  type: TableType;
  label: string;
  className: string;
  shape: "vertical" | "horizontal";
};

type Session = {
  id: number;
  table_number: number;
  table_type?: TableType | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  base_price: number | null;
  discount_name: string | null;
  discount_percent: number | null;
  hourly_rate?: number | null;
  member_discount_applied?: boolean | null;
  final_price: number | null;
  day_type: DayType | null;
  status: "active" | "finished";
  created_at: string;
};

const TABLES: TableConfig[] = [
  { number: 1, type: "pool", label: "Pool", className: "left-[8%] top-[18%]", shape: "vertical" },
  { number: 2, type: "pool", label: "Pool", className: "left-[8%] top-[42%]", shape: "vertical" },
  { number: 3, type: "pool", label: "Pool", className: "left-[8%] top-[66%]", shape: "vertical" },
  { number: 4, type: "heyball", label: "Heyball", className: "left-[39%] top-[8%]", shape: "horizontal" },
  { number: 5, type: "heyball", label: "Heyball", className: "left-[39%] top-[41%]", shape: "horizontal" },
  { number: 6, type: "heyball", label: "Heyball", className: "left-[39%] top-[72%]", shape: "horizontal" },
  { number: 7, type: "snooker", label: "Snooker", className: "left-[68%] top-[7%]", shape: "horizontal" },
  { number: 8, type: "snooker", label: "Snooker", className: "left-[68%] top-[28%]", shape: "horizontal" },
  { number: 9, type: "snooker", label: "Snooker", className: "left-[68%] top-[50%]", shape: "horizontal" },
  { number: 10, type: "snooker", label: "Snooker", className: "left-[68%] top-[72%]", shape: "horizontal" },
];

const PRICES: Record<DayType, number> = {
  week: 40,
  weekend: 50,
};

const MEMBER_DISCOUNT_AMOUNT = 5;

const TYPE_COLORS: Record<TableType, string> = {
  pool: "bg-blue-700",
  heyball: "bg-emerald-900",
  snooker: "bg-green-700",
};

function toLocalTimestamp(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatClock(secondsTotal: number) {
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} zł`;
}

function getTableConfig(tableNumber: number) {
  return TABLES.find((table) => table.number === tableNumber);
}

export default function Home() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [memberDiscount, setMemberDiscount] = useState(false);
  const [customHourlyRate, setCustomHourlyRate] = useState("");
  const [dayType, setDayType] = useState<DayType>("week");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedConfig = selectedTable ? getTableConfig(selectedTable) : null;

  useEffect(() => {
    loadData();

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  async function loadData() {
    const [activeResponse, historyResponse] = await Promise.all([
      supabase
        .from("game_sessions")
        .select("*")
        .eq("status", "active")
        .order("start_time", { ascending: true }),
      supabase
        .from("game_sessions")
        .select("*")
        .eq("status", "finished")
        .order("end_time", { ascending: false })
        .limit(20),
    ]);

    if (activeResponse.error) setMessage(activeResponse.error.message);
    if (historyResponse.error) setMessage(historyResponse.error.message);

    setActiveSessions((activeResponse.data as Session[]) ?? []);
    setHistory((historyResponse.data as Session[]) ?? []);
  }

  function getActiveSession(tableNumber: number) {
    return activeSessions.find((session) => session.table_number === tableNumber);
  }

  function getSessionSeconds(session: Session) {
    const startTime = new Date(session.start_time).getTime();
    return Math.max(0, Math.floor((now.getTime() - startTime) / 1000));
  }

  function getHourlyRate() {
    const manualRate = Number(customHourlyRate.replace(",", "."));
    if (!Number.isNaN(manualRate) && manualRate > 0) {
      return manualRate;
    }
    return PRICES[dayType];
  }

  async function startGame(table: TableConfig) {
    const active = getActiveSession(table.number);

    if (active) {
      setMessage("Ten stół jest już odpalony. Najpierw zakończ aktualną grę.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from("game_sessions").insert({
      table_number: table.number,
      table_type: table.type,
      start_time: toLocalTimestamp(new Date()),
      status: "active",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setSelectedTable(null);
      await loadData();
    }

    setLoading(false);
  }

  async function endGame(session: Session) {
    setLoading(true);
    setMessage(null);

    const endTime = new Date();
    const startTime = new Date(session.start_time);

    const durationMinutes = Math.max(
      1,
      Math.ceil((endTime.getTime() - startTime.getTime()) / 60000)
    );

    const hourlyRate = getHourlyRate();
    const basePrice = (durationMinutes / 60) * hourlyRate;
    const discountAmount = memberDiscount ? MEMBER_DISCOUNT_AMOUNT : 0;
    const finalPrice = Math.max(0, basePrice - discountAmount);
    const tableConfig = getTableConfig(session.table_number);

    const { error } = await supabase
      .from("game_sessions")
      .update({
        table_type: tableConfig?.type ?? session.table_type ?? null,
        end_time: toLocalTimestamp(endTime),
        duration_minutes: durationMinutes,
        hourly_rate: Number(hourlyRate.toFixed(2)),
        base_price: Number(basePrice.toFixed(2)),
        member_discount_applied: memberDiscount,
        discount_name: memberDiscount ? `Członek -${MEMBER_DISCOUNT_AMOUNT} zł` : "Brak",
        discount_percent: 0,
        final_price: Number(finalPrice.toFixed(2)),
        day_type: dayType,
        status: "finished",
      })
      .eq("id", session.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Zakończono grę. Cena końcowa: ${finalPrice.toFixed(2)} zł`);
      setSelectedTable(null);
      setMemberDiscount(false);
      setCustomHourlyRate("");
      await loadData();
    }

    setLoading(false);
  }

  const todayRevenue = history
    .filter((session) => {
      if (!session.end_time) return false;
      return new Date(session.end_time).toDateString() === new Date().toDateString();
    })
    .reduce((sum, session) => sum + Number(session.final_price ?? 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Naliczanie czasu gry</h1>
            <p className="text-slate-300">10 stołów: 4 snookery, 3 poole, 3 heyballe.</p>
          </div>

          <div className="rounded-2xl bg-white p-4 text-slate-900 shadow">
            <p className="text-sm text-slate-500">Dzisiejszy utarg</p>
            <p className="text-2xl font-bold">{todayRevenue.toFixed(2)} zł</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl bg-white p-4 font-medium text-slate-900 shadow">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-2xl bg-white p-4 text-slate-900 shadow md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black uppercase tracking-wide">Mapa klubu</h2>
              <div className="hidden gap-2 text-xs font-semibold sm:flex">
                <span className="rounded-full bg-blue-700 px-3 py-1 text-white">Pool</span>
                <span className="rounded-full bg-emerald-900 px-3 py-1 text-white">Heyball</span>
                <span className="rounded-full bg-green-700 px-3 py-1 text-white">Snooker</span>
              </div>
            </div>

            <div className="relative mx-auto aspect-[16/10] max-w-5xl overflow-hidden rounded-xl border-4 border-slate-800 bg-zinc-300 shadow-inner">
              <div className="absolute left-[2%] top-[34%] -rotate-90 text-3xl font-black tracking-widest text-blue-700 md:text-5xl">
                POOLBILLARD
              </div>
              <div className="absolute left-[31%] top-[38%] -rotate-90 text-3xl font-black tracking-widest text-emerald-900 md:text-5xl">
                HEYBALL
              </div>
              <div className="absolute right-[1%] top-[38%] -rotate-90 text-3xl font-black tracking-widest text-green-700 md:text-5xl">
                SNOOKER
              </div>
              <div className="absolute bottom-[3%] right-[4%] text-2xl font-black text-slate-950 md:text-5xl">
                WCSB<span className="text-red-600">.</span>
              </div>

              {TABLES.map((table) => {
                const active = getActiveSession(table.number);
                const isSelected = selectedTable === table.number;
                const sizeClass =
                  table.shape === "vertical" ? "h-[18%] w-[11%]" : "h-[12%] w-[20%]";

                return (
                  <button
                    key={table.number}
                    onClick={() => setSelectedTable(table.number)}
                    className={`absolute ${table.className} ${sizeClass} ${TYPE_COLORS[table.type]} rounded-sm shadow-lg transition hover:scale-105 ${
                      active ? "ring-4 ring-red-500" : "ring-2 ring-transparent"
                    } ${isSelected ? "outline outline-4 outline-yellow-300" : ""}`}
                  >
                    <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl font-black text-slate-950 shadow md:h-16 md:w-16 md:text-5xl">
                      {table.number}
                    </span>

                    {active && (
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white shadow">
                        {formatClock(getSessionSeconds(active))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 text-slate-900 shadow md:p-6">
            <h2 className="mb-4 text-xl font-bold">Obsługa stołu</h2>

            {!selectedTable || !selectedConfig ? (
              <p className="rounded-xl bg-slate-100 p-4 text-slate-600">
                Kliknij stół na mapie, żeby rozpocząć albo zakończyć grę.
              </p>
            ) : !getActiveSession(selectedTable) ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">Wybrany stół</p>
                  <p className="text-3xl font-black">{selectedTable}</p>
                  <p className="font-semibold">{selectedConfig.label}</p>
                  <p className="mt-2 text-sm text-green-700">Status: wolny</p>
                </div>

                <button
                  disabled={loading}
                  onClick={() => startGame(selectedConfig)}
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white disabled:opacity-50"
                >
                  Start gry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-sm text-slate-500">Stół {selectedTable} — gra trwa</p>
                  <p className="text-3xl font-black">
                    {formatClock(getSessionSeconds(getActiveSession(selectedTable)!))}
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border p-3">
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={memberDiscount}
                      onChange={(event) => setMemberDiscount(event.target.checked)}
                    />
                    Zniżka członkowska -{MEMBER_DISCOUNT_AMOUNT} zł
                  </label>

                  <div>
                    <label className="mb-1 block font-semibold">Cena za godzinę ręcznie</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customHourlyRate}
                      onChange={(event) => setCustomHourlyRate(event.target.value)}
                      placeholder="Zostaw puste: tydzień 40 zł / weekend 50 zł"
                      className="w-full rounded-xl border p-3"
                    />
                    <p className="mt-1 text-sm text-slate-500">
                      Aktualnie liczy: {getHourlyRate().toFixed(2)} zł/h
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-semibold">Typ dnia</label>
                  <div className="space-y-2">
                    <label className="block rounded-xl border p-3">
                      <input
                        type="radio"
                        checked={dayType === "week"}
                        onChange={() => setDayType("week")}
                      />{" "}
                      Tydzień — {PRICES.week} zł/h
                    </label>

                    <label className="block rounded-xl border p-3">
                      <input
                        type="radio"
                        checked={dayType === "weekend"}
                        onChange={() => setDayType("weekend")}
                      />{" "}
                      Weekend — {PRICES.weekend} zł/h
                    </label>
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={() => {
                    const session = getActiveSession(selectedTable);
                    if (session) endGame(session);
                  }}
                  className="w-full rounded-xl bg-red-600 px-6 py-4 font-bold text-white disabled:opacity-50"
                >
                  Zakończ grę i policz cenę
                </button>
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-4 text-slate-900 shadow md:p-6">
          <h2 className="mb-4 text-xl font-bold">Ostatnie zakończone gry</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Stół</th>
                  <th className="p-2">Typ</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">Koniec</th>
                  <th className="p-2">Czas</th>
                  <th className="p-2">Dzień</th>
                  <th className="p-2">Stawka</th>
                  <th className="p-2">Zniżka</th>
                  <th className="p-2">Cena</th>
                </tr>
              </thead>

              <tbody>
                {history.map((session) => {
                  const config = getTableConfig(session.table_number);

                  return (
                    <tr key={session.id} className="border-b">
                      <td className="p-2 font-bold">{session.table_number}</td>
                      <td className="p-2">{config?.label ?? session.table_type ?? "-"}</td>
                      <td className="p-2">{new Date(session.start_time).toLocaleString("pl-PL")}</td>
                      <td className="p-2">
                        {session.end_time ? new Date(session.end_time).toLocaleString("pl-PL") : "-"}
                      </td>
                      <td className="p-2">{session.duration_minutes ?? "-"} min</td>
                      <td className="p-2">
                        {session.day_type === "weekend" ? "Weekend" : "Tydzień"}
                      </td>
                      <td className="p-2">
                        {formatMoney(
                          session.hourly_rate ??
                            (session.day_type === "weekend" ? PRICES.weekend : PRICES.week)
                        )}
                        /h
                      </td>
                      <td className="p-2">
                        {session.member_discount_applied
                          ? `Członek -${MEMBER_DISCOUNT_AMOUNT} zł`
                          : session.discount_name ?? "Brak"}
                      </td>
                      <td className="p-2 font-bold">{formatMoney(session.final_price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
