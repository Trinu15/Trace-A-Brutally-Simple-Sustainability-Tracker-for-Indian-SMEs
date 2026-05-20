import { useEffect, useState } from "react";

export function FactoryMode() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("factory-mode") === "1";
    setOn(stored);
    document.documentElement.classList.toggle("factory-mode", stored);
  }, []);
  function toggle() {
    const next = !on;
    setOn(next);
    localStorage.setItem("factory-mode", next ? "1" : "0");
    document.documentElement.classList.toggle("factory-mode", next);
  }
  return (
    <button
      onClick={toggle}
      title="Factory Mode — high-contrast, big-tap UI for shop floor"
      className="hidden h-8 items-center gap-1.5 rounded-full border border-border px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-foreground hover:text-foreground md:inline-flex"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "pulse-dot" : ""}`} style={{ background: on ? "var(--signal)" : "var(--muted-foreground)" }} />
      Factory Mode {on ? "ON" : "off"}
    </button>
  );
}