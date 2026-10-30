import { compactNumber } from "@/lib/utils";

export function LineChart({
  data,
  height = 180,
  label,
}: {
  data: { label: string; value: number }[];
  height?: number;
  label?: string;
}) {
  if (!data.length) {
    return <div className="flex h-40 items-center justify-center border border-dashed border-rule font-sans text-[11px] text-ink-soft">No data for this range</div>;
  }
  const width = 640;
  const pad = { top: 12, right: 8, bottom: 22, left: 34 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => [pad.left + i * step, pad.top + innerH - (d.value / max) * innerH] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pad.left + innerW},${pad.top + innerH} L${pad.left},${pad.top + innerH} Z`;
  const ticks = [0, 0.5, 1].map((t) => ({ y: pad.top + innerH * (1 - t), v: Math.round(max * t) }));

  return (
    <figure>
      {label && <figcaption className="mb-2 font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">{label}</figcaption>}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label ?? "Trend chart"}>
        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={pad.left} x2={width - pad.right} y1={t.y} y2={t.y} stroke="var(--rule)" strokeWidth="1" />
            <text x={pad.left - 6} y={t.y + 3} textAnchor="end" fontFamily="Inter, sans-serif" fontSize="8" fill="var(--ink-soft)">
              {compactNumber(t.v)}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--accent)" opacity="0.08" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" />
        {points.length > 0 && (
          <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.6" fill="var(--accent)" />
        )}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
          return (
            <text key={`${d.label}-${i}`} x={points[i][0]} y={height - 6} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="var(--ink-soft)">
              {d.label.slice(5)}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}

export function BarList({
  data,
  label,
  suffix = "",
}: {
  data: { label: string; value: number; href?: string }[];
  label?: string;
  suffix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {label && <p className="mb-2 font-sans text-[9.5px] uppercase tracking-kicker text-ink-soft">{label}</p>}
      <ul className="space-y-2.5">
        {data.map((d) => (
          <li key={d.label}>
            <div className="flex items-baseline justify-between gap-3 font-sans text-[11.5px]">
              <span className="truncate text-ink">{d.label}</span>
              <span className="shrink-0 text-ink-soft">{compactNumber(d.value)}{suffix}</span>
            </div>
            <div className="mt-1 h-[3px] w-full bg-rule">
              <div className="h-full bg-ink" style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
