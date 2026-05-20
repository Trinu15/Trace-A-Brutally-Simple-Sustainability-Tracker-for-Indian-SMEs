import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useReveal } from "@/hooks/use-reveal";
import { Counter } from "@/components/Counter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trace — One honest sustainability number per batch" },
      {
        name: "description",
        content:
          "Track water, electricity, fuel and waste per production batch in under 2 minutes. Built for Indian SME factories.",
      },
      { property: "og:title", content: "Trace — Sustainability per batch" },
      {
        property: "og:description",
        content: "A digital batch register for factories. Audit-ready, mobile-first, no jargon.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useReveal();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="reveal">
            <div className="mb-6 inline-flex items-center gap-2 border border-border bg-card px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: "var(--signal)" }} />
              digital batch register · v0.1
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              One honest <br />
              sustainability number <br />
              <span className="relative inline-block" style={{ color: "var(--signal)" }}>
                per batch.
                <span className="absolute -bottom-1 left-0 h-1 w-full" style={{ background: "var(--signal)", opacity: 0.25 }} />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Track water, electricity, fuel and waste per production batch in under 2 minutes —
              on the same Android phone your store-in-charge already uses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="group inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 text-base font-semibold text-background transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--signal)]"
              >
                Try the demo factory
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/new"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-foreground bg-background px-6 text-base font-semibold lift"
              >
                Create new batch
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span>✓ works on 2GB Android</span>
              <span>✓ no signup</span>
              <span>✓ prints to A4</span>
            </div>
          </div>

          <div className="relative grain reveal overflow-hidden rounded-lg border-2 border-foreground bg-card p-6 signal-glow">
            <div className="mb-3 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span>Batch B246 · Garment</span>
              <span>3,500 units</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded border-2 border-foreground" style={{ background: "var(--signal)" }}>
                <Counter value={78} className="font-mono text-3xl font-bold leading-none" />
                <div className="text-[10px] uppercase tracking-widest">/ 100</div>
              </div>
              <div className="flex-1 space-y-1.5 text-sm">
                <Row label="Water / unit" value="48 L" />
                <Row label="Electricity / unit" value="2.1 kWh" />
                <Row label="Fuel" value="—" sub="deduct 10" />
                <Row label="Waste" value="Recycler" sub="deduct 5" />
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-3 font-mono text-xs text-muted-foreground">
              Generated · 18:42 IST · Ready to print
            </div>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="mt-14 overflow-hidden border-y-2 border-foreground bg-foreground py-3 text-background">
          <div className="marquee-track font-mono text-xs uppercase tracking-[0.25em]">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} className="inline-flex items-center gap-12">
                <span>◉ water · litres / unit</span>
                <span>◉ electricity · kwh / unit</span>
                <span>◉ fuel · diesel · lpg · coal</span>
                <span>◉ waste · recycler / landfill</span>
                <span style={{ color: "var(--signal)" }}>◉ one honest number per batch</span>
                <span>◉ audit-ready · prints to A4</span>
                <span>◉ tiruppur · ludhiana · sivakasi</span>
              </span>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: "fields per batch", v: 6, suf: "" },
            { k: "minutes to log", v: 2, suf: "" },
            { k: "score precision", v: 100, suf: " / 100" },
            { k: "android RAM target", v: 2, suf: " GB" },
          ].map((s) => (
            <div key={s.k} className="reveal lift rounded-lg border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.k}</div>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums">
                <Counter value={s.v} />
                <span className="text-muted-foreground">{s.suf}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Feature n="01" title="6 fields. 2 minutes." body="Batch ID, product, units, date, material. One question per screen. Built for Class-10 literacy." />
          <Feature n="02" title="The math is visible." body="Every deduction is shown. No black-box AI. The buyer can verify the score on paper." />
          <Feature n="03" title="Prints like an invoice." body="A4 Report Card with totals, per-unit ratios and a plain-language observation. Factories trust documents." />
        </div>

        {/* CTA */}
        <div className="reveal mt-16 overflow-hidden rounded-lg border-2 border-foreground">
          <div className="grid items-center gap-4 p-6 md:grid-cols-[1fr_auto] md:p-8" style={{ background: "var(--signal)" }}>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-black/70">ready in 30 seconds</div>
              <h3 className="mt-1 text-2xl font-bold text-black md:text-3xl">Open the demo factory · 6 months pre-loaded</h3>
            </div>
            <Link to="/dashboard" className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 font-semibold text-background lift">
              Enter →
            </Link>
          </div>
        </div>
      </main>
      <footer className="no-print border-t border-border py-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Trace · built for Indian SME manufacturing
      </footer>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-border pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">
        {value}
        {sub && <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

function Feature({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="reveal lift rounded-md border-t-2 border-foreground bg-card p-4 pt-4">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{n}</div>
      <h3 className="mt-1 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
