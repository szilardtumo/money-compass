import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';
import { apiQueries } from '@/server/api/queries';

interface SubaccountsCardProps {
  accountId: string;
}

export async function SubaccountsCard({ accountId }: SubaccountsCardProps) {
  const account = await apiQueries.accounts.getAccount(accountId);

  if (!account) return null;

  const { subaccounts, totalBalance } = account;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subaccounts</CardTitle>
      </CardHeader>
      <CardContent className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subaccount</TableHead>
              <TableHead>Share</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!subaccounts.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Click on the Edit button in the header to add a subaccount.
                </TableCell>
              </TableRow>
            )}
            {subaccounts.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Badge>{formatPercent(item.balance.mainCurrencyValue / totalBalance)}</Badge>
                </TableCell>
                <TableCell className="uppercase">{item.originalCurrency}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.balance.originalValue, item.originalCurrency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {!!subaccounts.length && (
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell colSpan={3} className="text-right">
                  {formatCurrency(totalBalance, subaccounts[0].mainCurrency)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  );
}
