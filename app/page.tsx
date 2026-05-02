"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DayType = "week" | "weekend";

const PRICES = {
  week: 40,
  weekend: 50,
};

const MEMBER_DISCOUNT = 5;

function getDayType(): DayType {
  const day = new Date().getDay(); // 0=nd, 1=pon...

  if (day === 0 || day >= 5) {
    return "weekend";
  }

  return "week";
}

function formatMoney(v: number) {
  return v.toFixed(2) + " zł";
}

export default function Home() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [member, setMember] = useState(false);
  const [customRate, setCustomRate] = useState("");
  const [archiveDate, setArchiveDate] = useState("");

  const dayType = getDayType();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const active = await supabase
      .from("game_sessions")
      .select("*")
      .eq("status", "active");

    const finished = await supabase
      .from("game_sessions")
      .select("*")
      .eq("status", "finished")
      .order("end_time", { ascending: false })
      .limit(20);

    setSessions(active.data || []);
    setHistory(finished.data || []);
  }

  function getActive(table: number) {
    return sessions.find((s) => s.table_number === table);
  }

  function getRate() {
    const r = Number(customRate);
    if (!isNaN(r) && r > 0) return r;
    return PRICES[dayType];
  }

  async function start(table: number) {
    if (getActive(table)) return alert("Zajęty");

    await supabase.from("game_sessions").insert({
      table_number: table,
      start_time: new Date(),
      status: "active",
    });

    load();
  }

  async function end(session: any) {
    const end = new Date();
    const start = new Date(session.start_time);

    const minutes = Math.ceil((end.getTime() - start.getTime()) / 60000);

    const rate = getRate();
    let price = (minutes / 60) * rate;

    if (member) price -= MEMBER_DISCOUNT;

    await supabase
      .from("game_sessions")
      .update({
        end_time: end,
        duration_minutes: minutes,
        final_price: price,
        day_type: dayType,
        member_discount_applied: member,
        hourly_rate: rate,
        status: "finished",
      })
      .eq("id", session.id);

    alert("Cena: " + formatMoney(price));

    setSelectedTable(null);
    setMember(false);
    setCustomRate("");

    load();
  }

  const todayRevenue = history
    .filter((s) =>
      new Date(s.end_time).toDateString() === new Date().toDateString()
    )
    .reduce((sum, s) => sum + (s.final_price || 0), 0);

  const archive = history.filter((s) => {
    if (!archiveDate) return false;
    return new Date(s.end_time).toISOString().slice(0, 10) === archiveDate;
  });

  const archiveRevenue = archive.reduce(
    (sum, s) => sum + (s.final_price || 0),
    0
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Stoły</h1>

      <p>
        Dzisiaj:{" "}
        <b>
          {dayType === "week" ? "Tydzień (40 zł/h)" : "Weekend (50 zł/h)"}
        </b>
      </p>

      <p>Dzisiejszy utarg: {formatMoney(todayRevenue)}</p>

      <div>
        {[1,2,3,4,5,6,7,8,9,10].map((t) => {
          const active = getActive(t);

          return (
            <div key={t}>
              Stół {t} - {active ? "Zajęty" : "Wolny"}

              {!active && <button onClick={() => start(t)}>Start</button>}

              {active && (
                <>
                  <br />

                  <label>
                    <input
                      type="checkbox"
                      checked={member}
                      onChange={(e) => setMember(e.target.checked)}
                    />
                    Członek (-5 zł)
                  </label>

                  <br />

                  <input
                    placeholder="Cena/h (opcjonalnie)"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                  />

                  <br />

                  <button onClick={() => end(active)}>Zakończ</button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <hr />

      <h2>Archiwum</h2>

      <input
        type="date"
        value={archiveDate}
        onChange={(e) => setArchiveDate(e.target.value)}
      />

      <p>Utarg dnia: {formatMoney(archiveRevenue)}</p>

      {archive.map((s) => (
        <div key={s.id}>
          Stół {s.table_number} | {s.duration_minutes} min |{" "}
          {formatMoney(s.final_price)}
        </div>
      ))}
    </div>
  );
}
