/** A small horizontal bar chart drawn as SVG, no library. Values already scoped by the guard. */
export default function Bars({ items, format }: { items: { label: string; value: number; flag?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value)); const fmt = format ?? ((v: number) => v.toLocaleString("en-US"));
  const rowH = 30, w = 640, labelW = 170;
  return (
    <div className="bars">
      <svg viewBox={`0 0 ${w} ${items.length * rowH + 6}`} role="img" aria-label="bar chart">
        {items.map((it, i) => {
          const y = i * rowH + 4; const bw = Math.max(2, ((w - labelW - 90) * it.value) / max);
          return (
            <g key={it.label}>
              <text x={0} y={y + 17} fontSize="13" fill="#1A2027">{it.label}</text>
              <rect x={labelW} y={y + 4} width={bw} height={18} rx={3} fill={it.flag ? "#A86A0B" : "#1F6B86"} />
              <text x={labelW + bw + 6} y={y + 17} fontSize="12" fill="#5B6672">{fmt(it.value)}{it.flag ? ` · ${it.flag}` : ""}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
