import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_TYPES } from "@/lib/scoring";
import { toast } from "sonner";

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "New batch — Trace" }] }),
  component: NewBatch,
});

type Form = {
  batch_id: string;
  product_type: string;
  units: string;
  start_date: string;
  raw_material: string;
};

const STEPS: { key: keyof Form; q: string; hint: string; type: "text" | "number" | "date" | "choice" }[] = [
  { key: "batch_id", q: "Batch ID", hint: "e.g. B247 or PO-2026-014", type: "text" },
  { key: "product_type", q: "Product type", hint: "Pick one", type: "choice" },
  { key: "units", q: "Units produced", hint: "Total pieces in this batch", type: "number" },
  { key: "start_date", q: "Start date", hint: "When did production begin?", type: "date" },
  { key: "raw_material", q: "Primary raw material", hint: "e.g. Cotton knit, Leather, Wheat flour", type: "text" },
];

function NewBatch() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    batch_id: "",
    product_type: "",
    units: "",
    start_date: new Date().toISOString().slice(0, 10),
    raw_material: "",
  });
  const [busy, setBusy] = useState(false);

  const current = STEPS[step];
  const val = form[current.key];
  const canNext = val.trim().length > 0 && (current.type !== "number" || Number(val) > 0);

  async function submit() {
    setBusy(true);
    const { data, error } = await supabase
      .from("batches")
      .insert({
        batch_id: form.batch_id.trim(),
        product_type: form.product_type,
        units: Number(form.units),
        start_date: form.start_date,
        raw_material: form.raw_material.trim(),
        completed: false,
      })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to create batch");
      return;
    }
    toast.success("Batch created");
    nav({ to: "/batch/$id", params: { id: data.id } });
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded ${i <= step ? "bg-foreground" : "bg-muted"}`}
              style={i === step ? { background: "var(--signal)" } : undefined}
            />
          ))}
        </div>

        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">{current.q}</h1>
        <p className="mb-6 text-muted-foreground">{current.hint}</p>

        {current.type === "choice" ? (
          <div className="grid grid-cols-2 gap-3">
            {PRODUCT_TYPES.map((p) => (
              <button
                key={p}
                onClick={() => setForm({ ...form, product_type: p })}
                className={`min-h-16 rounded-md border-2 px-4 py-3 text-left font-semibold capitalize transition ${
                  form.product_type === p
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:border-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        ) : (
          <input
            autoFocus
            type={current.type === "number" ? "number" : current.type === "date" ? "date" : "text"}
            inputMode={current.type === "number" ? "numeric" : undefined}
            value={val}
            onChange={(e) => setForm({ ...form, [current.key]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canNext) next();
            }}
            className="h-16 w-full rounded-md border-2 border-border bg-card px-5 text-2xl font-semibold outline-none focus:border-foreground"
            placeholder={current.hint}
          />
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="h-12 rounded-md px-4 font-semibold text-muted-foreground disabled:opacity-30"
          >
            ← Back
          </button>
          <button
            onClick={next}
            disabled={!canNext || busy}
            className="h-14 flex-1 rounded-md bg-foreground px-6 text-lg font-bold text-background disabled:opacity-40"
          >
            {busy ? "Saving…" : step < STEPS.length - 1 ? "Continue →" : "Create batch"}
          </button>
        </div>
      </main>
    </div>
  );
}