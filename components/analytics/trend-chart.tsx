import type { TrendPoint } from "@/lib/queries/analytics";

const WIDTH = 720;
const HEIGHT = 200;
const PADDING = 24;

function formatDay(day: string) {
  const d = new Date(`${day}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No views recorded in this period yet.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.views), 1);
  const innerW = WIDTH - PADDING * 2;
  const innerH = HEIGHT - PADDING * 2;

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? PADDING + innerW / 2
        : PADDING + (i / (data.length - 1)) * innerW;
    const y = PADDING + innerH - (d.views / max) * innerH;
    return { x, y, ...d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PADDING},${PADDING + innerH} ${line} ${
    points[points.length - 1].x
  },${PADDING + innerH}`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-48 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Views over time"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={PADDING}
          y1={PADDING + innerH}
          x2={WIDTH - PADDING}
          y2={PADDING + innerH}
          stroke="var(--border)"
          strokeWidth="1"
        />

        <polygon points={area} fill="url(#trend-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle key={p.day} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDay(data[0].day)}</span>
        <span>Peak: {max} views/day</span>
        <span>{formatDay(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}
