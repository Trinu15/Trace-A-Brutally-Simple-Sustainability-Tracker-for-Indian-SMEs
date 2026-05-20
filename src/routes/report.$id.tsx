import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateScore,
  observation,
  type Batch,
  type ResourceLog,
} from "@/lib/scoring";

export const Route = createFileRoute("/report/$id")({
  head: () => ({ meta: [{ title: "Report card — Trace" }] }),
  component: ReportView,
});

function ReportView() {
  const { id } = Route.useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<ResourceLog[]>([]);
  const [prev, setPrev] = useState<{ batch: Batch; logs: ResourceLog[] } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase.from("batches").select("*").eq("id", id).maybeSingle();
      const { data: l } = await supabase.from("resource_logs").select("*").eq("batch_id", id);
      setBatch(b as Batch | null);
      setLogs((l ?? []) as ResourceLog[]);
      if (b) {
        const { data: p } = await supabase
          .from("batches")
          .select("*")
          .eq("product_type", b.product_type)
          .eq("completed", true)
          .lt("start_date", b.start_date)
          .order("start_date", { ascending: false })
          .limit(1);
        if (p && p[0]) {
          const { data: pl } = await supabase.from("resource_logs").select("*").eq("batch_id", p[0].id);
          setPrev({ batch: p[0] as Batch, logs: (pl ?? []) as ResourceLog[] });
        }
      }
    })();
  }, [id]);

  if (!batch) return <div className="min-h-screen"><Header /><main className="p-10 text-muted-foreground">Loading…</main></div>;

  const calc = calculateScore(batch, logs);
  const prevCalc = prev ? calculateScore(prev.batch, prev.logs) : null;
  const obs = observation({ totals: calc.totals }, prevCalc ? { totals: prevCalc.totals } : null, batch.product_type);
  const today = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const ROWS = [
    { label: "Water", total: calc.totals.water, unit: "L", per: calc.totals.waterPerUnit, perUnit: "L/unit" },
    { label: "Electricity", total: calc.totals.electricity, unit: "kWh", per: calc.totals.electricityPerUnit, perUnit: "kWh/unit" },
    { label: "Fuel", total: calc.totals.fuel, unit: "L/kg", per: calc.totals.fuelPerUnit, perUnit: "/unit" },
    { label: "Waste", total: calc.totals.waste, unit: "kg", per: calc.totals.wastePerUnit, perUnit: "kg/unit" },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="no-print mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-6">
        <Link to="/batch/$id" params={{ id }} className="text-sm text-muted-foreground hover:underline">
          ← Back to batch
        </Link>
        <button
          onClick={() => window.print()}
          className="h-11 rounded-md bg-foreground px-5 font-semibold text-background"
        >
          Print / Save as PDF
        </button>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="print-area rounded-lg border-2 border-foreground bg-white p-8 text-black shadow-[6px_6px_0_0_var(--foreground)] print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 border-2 border-black" style={{ background: "var(--signal)" }} />
                <span className="font-mono text-sm font-bold tracking-widest">TRACE</span>
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-gray-600">
                Batch Sustainability Report Card
              </div>
            </div>
            <div className="text-right font-mono text-xs text-gray-700">
              <div>Issued · {today}</div>
              <div>Doc · TRC-{batch.batch_id}</div>
            </div>
          </div>

          {/* Batch meta */}
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm md:grid-cols-4">
            <Meta k="Batch ID" v={batch.batch_id} />
            <Meta k="Product" v={batch.product_type} />
            <Meta k="Units" v={batch.units.toLocaleString()} />
            <Meta k="Start" v={batch.start_date} />
            <Meta k="Raw material" v={batch.raw_material || "—"} />
            <Meta k="Status" v={batch.completed ? "Complete" : "In progress"} />
          </div>

          {/* Score block */}
          <div className="mt-6 grid gap-6 border-y-2 border-black py-6 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-600">Sustainability score</div>
              <div className="mt-1 font-mono text-7xl font-extrabold leading-none tabular-nums">{calc.score}</div>
              <div className="font-mono text-xs tracking-widest text-gray-600">/ 100</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black text-left font-mono text-[10px] uppercase tracking-widest text-gray-600">
                  <th className="pb-1">Metric</th>
                  <th className="pb-1">Detail</th>
                  <th className="pb-1 text-right">Deduction</th>
                </tr>
              </thead>
              <tbody>
                {calc.deductions.map((d) => (
                  <tr key={d.label} className="border-b border-dashed border-gray-300">
                    <td className="py-1.5 font-semibold">{d.label}</td>
                    <td className="py-1.5 text-gray-700">{d.detail}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {d.value === 0 ? "0" : `−${d.value}`}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-2 font-mono text-[10px] uppercase tracking-widest text-gray-600">Start</td>
                  <td></td>
                  <td className="pt-2 text-right font-mono tabular-nums">100</td>
                </tr>
                <tr>
                  <td className="font-mono text-[10px] uppercase tracking-widest text-gray-600">Total deduction</td>
                  <td></td>
                  <td className="text-right font-mono tabular-nums">−{100 - calc.score}</td>
                </tr>
                <tr>
                  <td className="pt-1 font-bold">Final</td>
                  <td></td>
                  <td className="pt-1 text-right font-mono text-lg font-bold tabular-nums">{calc.score} / 100</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Resource summary */}
          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-gray-600">Resource summary</div>
            <table className="w-full border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 text-left font-mono text-[10px] uppercase tracking-widest text-gray-700">
                  <th className="border-b border-black px-3 py-2">Resource</th>
                  <th className="border-b border-black px-3 py-2 text-right">Total</th>
                  <th className="border-b border-black px-3 py-2 text-right">Per unit</th>
                  <th className="border-b border-black px-3 py-2 text-right">vs prev batch</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => {
                  const prevPer =
                    prevCalc
                      ? r.label === "Water"
                        ? prevCalc.totals.waterPerUnit
                        : r.label === "Electricity"
                          ? prevCalc.totals.electricityPerUnit
                          : r.label === "Fuel"
                            ? prevCalc.totals.fuelPerUnit
                            : prevCalc.totals.wastePerUnit
                      : null;
                  const diff = prevPer && prevPer > 0 ? ((r.per - prevPer) / prevPer) * 100 : null;
                  return (
                    <tr key={r.label} className={i % 2 ? "bg-gray-50" : ""}>
                      <td className="border-b border-gray-300 px-3 py-2 font-semibold">{r.label}</td>
                      <td className="border-b border-gray-300 px-3 py-2 text-right font-mono tabular-nums">
                        {r.total.toFixed(1)} {r.unit}
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-right font-mono tabular-nums">
                        {r.per.toFixed(2)} {r.perUnit}
                      </td>
                      <td className="border-b border-gray-300 px-3 py-2 text-right font-mono tabular-nums">
                        {diff === null ? "—" : `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Observation */}
          <div className="mt-6 border-l-4 bg-gray-50 px-4 py-3" style={{ borderColor: "var(--signal)" }}>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-gray-600">Observation</div>
            <div className="text-sm">{obs}</div>
          </div>

          {/* Signatures */}
          <div className="mt-10 grid grid-cols-2 gap-8 font-mono text-xs">
            <div>
              <div className="border-t border-black pt-1 text-gray-600">Prepared by</div>
            </div>
            <div>
              <div className="border-t border-black pt-1 text-gray-600">Verified by</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-300 pt-3 font-mono text-[10px] uppercase tracking-widest text-gray-600">
            <span>Generated by Trace · trace.local</span>
            <span>{today}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-gray-600">{k}</div>
      <div className="font-semibold capitalize">{v}</div>
    </div>
  );
}