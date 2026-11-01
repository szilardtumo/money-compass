import { cn } from 'cn';

/**
 * A line of the values with the area under it, stretched to its box.
 */
export function TrendLine({
  values,
  color,
  className,
}: {
  values: number[];
  color: string;
  className?: string;
}) {
  const min = Math.min(...values);
  const spread = Math.max(...values) - min || 1;
  const line = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 28 - ((value - min) / spread) * 26;
      return `${index ? 'L' : 'M'}${x} ${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('h-8 w-full', className)}
    >
      <path d={`${line} L100 30 L0 30 Z`} fill={color} opacity={0.15} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
