'use client';

import {
  HISTORY_RANGES,
  useHistoryRange,
} from '@/components/cards/net-worth-history-card/use-history-range';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function HistoryRangeTabs() {
  const [range, setRange] = useHistoryRange();

  return (
    <Tabs value={range} onValueChange={(value) => setRange(value as typeof range)}>
      <TabsList>
        {HISTORY_RANGES.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
