import { cn } from "@/lib/utils";

export function ScoreGauge({
  value,
  label,
  size = 120,
}: {
  value: number;
  label?: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (clamped / 100) * circ;
  const color =
    clamped >= 80 ? "var(--color-success)" : clamped >= 60 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <div className={cn("flex flex-col items-center gap-2")}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className="fill-none stroke-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="fill-none transition-all duration-700"
            style={{ stroke: color, strokeDasharray: circ, strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{clamped}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">score</span>
        </div>
      </div>
      {label && <div className="text-sm text-muted-foreground">{label}</div>}
    </div>
  );
}
