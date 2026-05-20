import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ScoreRing } from "@/components/ScoreRing";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateScore,
  observation,
  type Batch,
  type ResourceLog,
} from "@/lib/scoring";
import { toast } from "sonner";

export const Route = createFileRoute("/batch/$id")({
  head: () => ({ meta: [{ title: "Batch — Trace" }] }),
  component: BatchView,
});

type Tab = "water" | "electricity" | "fuel" | "waste";

const SUBTYPES: Record<Tab, string[]> = {
  water: ["municipal", "borewell", "tanker"],
  electricity: ["grid", "solar"],
  fuel: ["diesel", "lpg", "coal"],
  waste: ["recycler", "composted", "landfill", "unknown"],
};

const UNITS: Record<Tab, string> = {
  water: "L",
  electricity: "kWh",
  fuel: "L / kg",
  waste: "kg",
};

function BatchView() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<ResourceLog[]>([]);
  const [prevTotals, setPrevTotals] = useState<ReturnType<typeof calculateScore>["totals"] | null>(null);
  const [tab, setTab] = useState<Tab>("water");
  const [amount, setAmount] = useState("");
  const [subtype, setSubtype] = useState<string>("municipal");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: b }, { data: l }] = await Promise.all([
      supabase.from("batches").select("*").eq("id", id).maybeSingle(),
      supabase.from("resource_logs").select("*").eq("batch_id", id).order("created_at", { ascending: false }),
    ]);
    setBatch(b as Batch | null);
    setLogs((l ?? []) as ResourceLog[]);

    if (b) {
      const { data: prev } = await supabase
        .from("batches")
        .select("*")
        .eq("product_type", b.product_type)
        .eq("completed", true)
        .lt("start_date", b.start_date)
        .order("start_date", { ascending: false })
        .limit(1);
      if (prev && prev[0]) {
        const { data: prevLogs } = await supabase.from("resource_logs").select("*").eq("batch_id", prev[0].id);
        const calc = calculateScore(prev[0] as Batch, (prevLogs ?? []) as ResourceLog[]);
        setPrevTotals(calc.totals);
      } else setPrevTotals(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Autofill: pick last-used subtype for this resource
  useEffect(() => {
    const last = logs.find((l) => l.resource_type === tab);
    setSubtype(last?.subtype || SUBTYPES[tab][0]);
    setAmount("");
    setNote("");
  }, [tab, logs.length]);

  const calc = useMemo(() => (batch ? calculateScore(batch, logs) : null), [batch, logs]);
  const obs = useMemo(
    () => (batch && calc ? observation({ totals: calc.totals }, prevTotals ? { totals: prevTotals } : null, batch.product_type) : ""),
    [batch, calc, prevTotals],
  );

  async function addLog() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter an amount");
      return;
    }
    const { error } = await supabase.from("resource_logs").insert({
      batch_id: id,
      resource_type: tab,
      amount: amt,
      subtype,
      note: note.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success(`Logged ${amt} ${UNITS[tab]} of ${tab}`);
    setAmount("");
    setNote("");
    load();
  }

  async function removeLog(logId: string) {
    await supabase.from("resource_logs").delete().eq("id", logId);
    load();
  }

  async function markComplete() {
    await supabase.from("batches").update({ completed: true }).eq("id", id);
    toast.success("Batch marked complete");
    nav({ to: "/report/$id", params: { id } });
  }

  async function deleteBatch() {
    if (!confirm("Delete this batch and all its logs?")) return;
    await supabase.from("batches").delete().eq("id", id);
    nav({ to: "/dashboard" });
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </main>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-muted-foreground">Batch not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {/* Summary */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Batch · {batch.completed ? "Complete" : "In progress"}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{batch.batch_id}</h1>
            <div className="mt-1 font-mono text-sm text-muted-foreground">
              {batch.product_type} · {batch.units.toLocaleString()} units · {batch.start_date}
              {batch.raw_material ? ` · ${batch.raw_material}` : ""}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/report/$id" params={{ id }} className="h-11 rounded-md border-2 border-foreground bg-background px-4 py-2.5 font-semibold hover:bg-muted">
              View report
            </Link>
            {!batch.completed && (
              <button onClick={markComplete} className="h-11 rounded-md bg-foreground px-4 font-semibold text-background">
                Complete batch →
              </button>
            )}
          </div>
        </div>

        {/* Score + breakdown */}
        {calc && (
          <section className="mb-8 grid gap-6 rounded-lg border border-border bg-card p-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center">
              <ScoreRing score={calc.score} />
              <div className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">live score</div>
            </div>
            <div>
              <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Deduction math</div>
              <table className="w-full text-sm">
                <tbody>
                  {calc.deductions.map((d) => (
                    <tr key={d.label} className="border-b border-dashed border-border last:border-0">
                      <td className="py-2 pr-2 font-semibold">{d.label}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{d.detail}</td>
                      <td className="py-2 text-right font-mono tabular-nums">
                        {d.value === 0 ? <span className="text-muted-foreground">0</span> : <span style={{ color: "var(--bad)" }}>−{d.value}</span>}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Final</td>
                    <td></td>
                    <td className="pt-3 text-right font-mono text-lg font-bold">{calc.score} / 100</td>
                  </tr>
                </tbody>
              </table>
              {obs && (
                <p className="mt-4 rounded border-l-4 bg-muted px-3 py-2 text-sm" style={{ borderColor: "var(--signal)" }}>
                  {obs}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Logging */}
        <section className="mb-8 rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-xl font-bold">Log resource use</h2>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {(["water", "electricity", "fuel", "waste"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`min-h-14 rounded-md border-2 px-3 py-2 text-sm font-bold capitalize transition ${
                  tab === t ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {SUBTYPES[tab].map((s) => (
              <button
                key={s}
                onClick={() => setSubtype(s)}
                className={`min-h-11 rounded-md border-2 px-4 py-2 text-sm font-semibold capitalize ${
                  subtype === s ? "border-foreground" : "border-border text-muted-foreground hover:border-foreground"
                }`}
                style={subtype === s ? { background: "var(--signal)", color: "black" } : undefined}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Amount ({UNITS[tab]})</label>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLog()}
                className="h-14 w-full rounded-md border-2 border-border bg-background px-4 text-xl font-semibold outline-none focus:border-foreground"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLog()}
                className="h-14 w-full rounded-md border-2 border-border bg-background px-4 outline-none focus:border-foreground"
                placeholder="e.g. dyeing rinse, shift 2"
              />
            </div>
            <button onClick={addLog} className="h-14 self-end rounded-md bg-foreground px-6 font-bold text-background">
              + Add
            </button>
          </div>
        </section>

        {/* Log list */}
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Entries ({logs.length})</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {logs.length === 0 && <div className="px-4 py-8 text-center text-muted-foreground">No entries yet.</div>}
            {logs.map((l, i) => (
              <div key={l.id} className={`flex items-center gap-3 px-4 py-3 ${i !== 0 ? "border-t border-border" : ""}`}>
                <div className="w-24 font-mono text-xs uppercase tracking-widest text-muted-foreground">{l.resource_type}</div>
                <div className="flex-1">
                  <div className="font-mono font-semibold tabular-nums">
                    {Number(l.amount).toLocaleString()} {UNITS[l.resource_type as Tab] ?? ""}
                    {l.subtype && <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-normal capitalize">{l.subtype}</span>}
                  </div>
                  {l.note && <div className="text-xs text-muted-foreground">{l.note}</div>}
                </div>
                <button onClick={() => removeLog(l.id)} className="text-xs text-muted-foreground hover:text-[color:var(--bad)]">
                  remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <button onClick={deleteBatch} className="text-xs text-muted-foreground hover:text-[color:var(--bad)]">
          Delete batch
        </button>
      </main>
    </div>
  );
}