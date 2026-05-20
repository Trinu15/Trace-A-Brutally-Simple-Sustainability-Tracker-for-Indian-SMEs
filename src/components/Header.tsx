import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 border-2 border-foreground" style={{ background: "var(--signal)" }} />
          <span className="font-mono text-sm font-bold tracking-tight">TRACE</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="rounded px-3 py-1.5 hover:bg-muted [&.active]:bg-foreground [&.active]:text-background" activeOptions={{ exact: false }}>
            Batches
          </Link>
          <Link to="/new" className="rounded bg-foreground px-3 py-1.5 text-background hover:opacity-90">
            + New batch
          </Link>
        </nav>
      </div>
    </header>
  );
}