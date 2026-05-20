import { Counter } from "./Counter";

export function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color =
    score >= 75 ? "var(--good)" : score >= 50 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.7,.2,1), stroke .3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Counter value={score} className="font-mono text-5xl font-bold tabular-nums" />
        <div className="text-xs uppercase tracking-widest text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}