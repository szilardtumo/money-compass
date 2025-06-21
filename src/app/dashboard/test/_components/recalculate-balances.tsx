'use client';

import { Button } from '@/components/ui/button';
import { _recalculateBalances } from '@/server/api/transactions/_recalculateBalances';
export function RecalculateBalances() {
  return (
    <Button variant="destructive" onClick={() => _recalculateBalances()}>
      Recalculate balances
    </Button>
  );
}
