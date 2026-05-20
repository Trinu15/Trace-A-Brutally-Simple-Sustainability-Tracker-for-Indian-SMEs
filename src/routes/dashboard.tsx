import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Header } from "@/components/Header";
import { useReveal } from "@/hooks/use-reveal";
import { supabase } from "@/integrations/supabase/client";
import { calculateScore, type Batch, type ResourceLog } from "@/lib/scoring";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Batches — Trace" }] }),
  component: Dashboard,
});

type BatchWithScore = Batch & { score: number; logs: ResourceLog[] };

function Dashboard() {
  const [rows, setRows] = useState<BatchWithScore[] | null>(null);
  useReveal();

  useEffect(() => {
    (async () => {
      const { data: batches } = await supabase
        .from("batches")
        .select("*")
        .order("start_date", { ascending: false });
      const { data: logs } = await supabase.from("resource_logs").select("*");
      const byBatch = new Map<string, ResourceLog[]>();
      (logs ?? []).forEach((l) => {
        const arr = byBatch.get(l.batch_id) ?? [];
        arr.push(l as ResourceLog);
        byBatch.set(l.batch_id, arr);
      });
      const scored: BatchWithScore[] = (batches ?? []).map((b) => {
        const ls = byBatch.get(b.id) ?? [];
        const { score } = calculateScore(b as Batch, ls);
        return { ...(b as Batch), score, logs: ls };
      });
      setRows(scored);
    })();
  }, []);

  const chartData = useMemo(() => {
    if (!rows) return [];
    return [...rows]
      .filter((r) => r.completed)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .map((r) => ({ name: r.batch_id, score: r.score }));
  }, [rows]);

  const top3 = useMemo(
    () => (rows ? [...rows].filter((r) => r.completed).sort((a, b) => b.score - a.score).slice(0, 3) : []),
    [rows],
  );
  const bottom3 = useMemo(
    () => (rows ? [...rows].filter((r) => r.completed).sort((a, b) => a.score - b.score).slice(0, 3) : []),
    [rows],
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Demo factory</div>
            <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
          </div>
          <Link to="/new" className="inline-flex h-11 items-center rounded-md bg-foreground px-5 font-semibold text-background">
            + New batch
          </Link>
        </div>

        {rows === null ? (
          <Skeleton />
        ) : (
          <>
            <section className="reveal mb-8 rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Score trend</h2>
                <span className="text-xs text-muted-foreground">{chartData.length} completed batches</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "ui-monospace" }} stroke="var(--muted-foreground)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "ui-monospace" }} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontFamily: "ui-monospace", fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="var(--signal)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--foreground)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="reveal mb-8 grid gap-4 md:grid-cols-2">
              <RankCard title="Top 3 scores" items={top3} accent="var(--good)" />
              <RankCard title="Bottom 3 scores" items={bottom3} accent="var(--bad)" />
            </div>

            <section>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">All batches</h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {rows.map((r, i) => (
                  <Link
                    to="/batch/$id"
                    params={{ id: r.id }}
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-4 hover:bg-muted ${i !== 0 ? "border-t border-border" : ""}`}
                  >
                    <ScoreBadge score={r.score} completed={r.completed} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono font-bold">{r.batch_id}</span>
                        <span className="truncate text-sm text-muted-foreground">· {r.product_type}</span>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {r.units.toLocaleString()} units · {r.start_date}
                      </div>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {r.completed ? "Complete" : "Open"} →
                    </span>
                  </Link>
                ))}
                {rows.length === 0 && (
                  <div className="px-4 py-10 text-center text-muted-foreground">
                    No batches yet. Create your first one.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ScoreBadge({ score, completed }: { score: number; completed: boolean }) {
  if (!completed)
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-dashed border-border font-mono text-xs text-muted-foreground">
        WIP
      </div>
    );
  const bg = score >= 75 ? "var(--good)" : score >= 50 ? "var(--warn)" : "var(--bad)";
  return (
    <div
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center border-2 border-foreground font-mono text-base font-bold"
      style={{ background: bg, color: score >= 75 || score < 50 ? "white" : "black" }}
    >
      {score}
    </div>
  );
}

function RankCard({ title, items, accent }: { title: string; items: BatchWithScore[]; accent: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-2 w-2" style={{ background: accent }} /> {title}
      </div>
      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.id} className="flex items-center justify-between text-sm">
            <Link to="/batch/$id" params={{ id: b.id }} className="font-mono hover:underline">
              {b.batch_id} · <span className="text-muted-foreground">{b.product_type}</span>
            </Link>
            <span className="font-mono font-bold tabular-nums">{b.score}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">No data yet</li>}
      </ul>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}