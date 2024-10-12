import { cn } from '@/lib/cn';

interface ChartCategoryIndicatorProps {
  indicator?: 'line' | 'dot' | 'dashed';
  color: string;
}

const ChartCategoryIndicator: React.FC<ChartCategoryIndicatorProps> = ({
  indicator = 'dot',
  color,
}) => {
  return (
    <div
      className={cn('shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]', {
        'h-2.5 w-2.5': indicator === 'dot',
        'w-1': indicator === 'line',
        'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
      })}
      style={
        {
          '--color-bg': color,
          '--color-border': color,
        } as React.CSSProperties
      }
    />
  );
};

export { ChartCategoryIndicator };
