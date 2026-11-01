import { TriangleAlertIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { getStaleSubaccounts } from './get-stale-subaccounts';

export async function StaleBalancesAlert() {
  const stale = await getStaleSubaccounts();
  if (!stale.length) {
    return null;
  }

  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>Some balances may be out of date</AlertTitle>
      <AlertDescription>
        <ul className="list-inside list-disc">
          {stale.map((item) => (
            <li key={item.id}>
              {item.name}, last updated {item.days} days ago
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
