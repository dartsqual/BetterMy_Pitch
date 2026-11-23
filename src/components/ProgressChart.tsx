// Readiness score over time: a small dependency-free SVG line chart.
export function ProgressChart({
  points,
  locale,
  labels,
}: {
  points: { date: string; score: number }[];
  locale: string;
  labels: { latest: string; best: string; scored: string; chart: string };
}) {
  const w = 320;
  const h = 120;
  const pad = 8;
  const n = points.length;
  const x = (i: number) => (n === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1));
  const y = (s: number) => h - pad - (s / 100) * (h - pad * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.score)}`).join(" ");
  const latest = points[n - 1].score;
  const delta = n > 1 ? latest - points[n - 2].score : 0;
  const best = Math.max(...points.map((p) => p.score));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-4 text-sm">
        <span>
          {labels.latest} <strong className="text-lg tabular-nums">{latest}</strong>
          {n > 1 && (
            <span className={delta >= 0 ? "ml-1 text-good" : "ml-1 text-bad"}>
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </span>
        <span className="text-muted">
          {labels.best} <strong className="tabular-nums text-foreground">{best}</strong>
        </span>
        <span className="text-muted">{n} {labels.scored}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={labels.chart}>
        {[25, 50, 75].map((g) => (
          <line key={g} x1={0} x2={w} y1={y(g)} y2={y(g)} className="stroke-border" strokeDasharray="3 4" />
        ))}
        <path d={path} fill="none" className="stroke-accent" strokeWidth={2.5} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.score)} r={3.5} className="fill-accent">
            <title>{`${new Date(p.date).toLocaleDateString(locale)}: ${p.score}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
