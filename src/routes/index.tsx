import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";

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
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-border bg-card px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--signal)" }} />
              digital batch register
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              One honest <br />
              sustainability number <br />
              <span style={{ color: "var(--signal)" }}>per batch.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Track water, electricity, fuel and waste per production batch in under 2 minutes —
              on the same Android phone your store-in-charge already uses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 text-base font-semibold text-background hover:opacity-90"
              >
                Try the demo factory →
              </Link>
              <Link
                to="/new"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-foreground bg-background px-6 text-base font-semibold hover:bg-muted"
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

          <div className="rounded-lg border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--foreground)]">
            <div className="mb-3 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span>Batch B246 · Garment</span>
              <span>3,500 units</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded border-2 border-foreground" style={{ background: "var(--signal)" }}>
                <div className="font-mono text-3xl font-bold leading-none">78</div>
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

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <Feature n="01" title="6 fields. 2 minutes." body="Batch ID, product, units, date, material. One question per screen. Built for Class-10 literacy." />
          <Feature n="02" title="The math is visible." body="Every deduction is shown. No black-box AI. The buyer can verify the score on paper." />
          <Feature n="03" title="Prints like an invoice." body="A4 Report Card with totals, per-unit ratios and a plain-language observation. Factories trust documents." />
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
    <div className="border-t-2 border-foreground pt-4">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{n}</div>
      <h3 className="mt-1 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
