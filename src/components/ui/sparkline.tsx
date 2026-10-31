interface SparklineProps {
  values: number[];
  color: string;
  width: number;
  height: number;
  /** The bar shown stronger, the last one by default, or none for null */
  highlight?: number | null;
}

/**
 * Tiny bars of the absolute values of a series, with one bar highlighted.
 */
export function Sparkline({
  values,
  color,
  width,
  height,
  highlight = values.length - 1,
}: SparklineProps) {
  const max = Math.max(...values.map(Math.abs)) || 1;
  const step = width / values.length;

  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      {values.map((value, index) => {
        const barHeight = Math.max((Math.abs(value) / max) * height, 1);
        return (
          <rect
            key={index}
            x={index * step + 1}
            y={height - barHeight}
            width={Math.max(step - 2, 1)}
            height={barHeight}
            rx={1}
            fill={color}
            opacity={highlight === null || index === highlight ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}
