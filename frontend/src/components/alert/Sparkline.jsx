/**
 * Tiny dependency-free SVG sparkline.
 * Props: data (array of numbers), width, height, stroke
 */
export default function Sparkline({ data, width = 200, height = 56, stroke = "#002FA7" }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });
  const path = points.reduce(
    (acc, [x, y], i) => acc + (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`),
    "",
  );
  // Area fill path
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  const last = data[data.length - 1];
  const first = data[0];
  const positive = last >= first;
  const lineColor = positive ? "#00C853" : "#FF3B30";
  const fill = positive ? "rgba(0,200,83,0.10)" : "rgba(255,59,48,0.10)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      data-testid="sparkline-svg"
      className="block"
    >
      <path d={areaPath} fill={fill} />
      <path d={path} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={lineColor}
      />
    </svg>
  );
}
