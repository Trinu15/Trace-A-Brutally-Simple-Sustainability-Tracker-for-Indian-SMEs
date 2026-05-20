import { useEffect, useState } from "react";

export function LiveClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const hh = t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums">{hh} IST</span>;
}