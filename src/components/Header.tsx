import { Link } from "@tanstack/react-router";
import { FactoryMode } from "./FactoryMode";
import { LiveClock } from "./LiveClock";

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative h-6 w-6 border-2 border-foreground" style={{ background: "var(--signal)" }}>
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full pulse-dot" style={{ background: "var(--signal)" }} />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight">TRACE</span>
          <span className="ml-2 hidden md:inline"><LiveClock /></span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <FactoryMode />
          <Link to="/dashboard" className="rounded px-3 py-1.5 hover:bg-muted [&.active]:bg-foreground [&.active]:text-background" activeOptions={{ exact: false }}>
            Batches
          </Link>
          <Link to="/new" className="rounded bg-foreground px-3 py-1.5 text-background transition hover:-translate-y-px hover:shadow-[0_4px_0_0_var(--signal)]">
            + New batch
          </Link>
        </nav>
      </div>
    </header>
  );
}