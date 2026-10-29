interface SparklineProps {
  values: number[];
  color: string;
  width: number;
  height: number;
}

/**
 * Tiny bars of a series, the last one highlighted. Negative values draw as empty bars.
 */
export function Sparkline({ values, color, width, height }: SparklineProps) {
  const max = Math.max(...values, 0) || 1;
  const step = width / values.length;

  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      {values.map((value, index) => {
        const barHeight = Math.max((Math.max(value, 0) / max) * height, 1);
        return (
          <rect
            key={index}
            x={index * step + 1}
            y={height - barHeight}
            width={Math.max(step - 2, 1)}
            height={barHeight}
            rx={1}
            fill={color}
            opacity={index === values.length - 1 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}
