import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPercent } from '@/lib/utils/formatters';
import { RETURN_RANGES, Returns } from '@/server/api/investments/overview';
import { apiQueries } from '@/server/api/queries';

export async function ReturnsCard() {
  const returns = await apiQueries.investments.getPortfolioReturns();
  const rows: { id: string; name: string; returns: Returns }[] = [
    { id: 'total', name: 'Total', returns: returns.total },
    ...returns.accounts,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns</CardTitle>
        <CardDescription>
          Money-weighted and annualized. Deposits and withdrawals don&apos;t count as gains.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              {RETURN_RANGES.map((range) => (
                <TableHead key={range} className="text-right">
                  {range}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                {RETURN_RANGES.map((range) => (
                  <TableCell key={range} className="text-right">
                    <ReturnValue value={row.returns[range]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReturnValue({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-help text-muted-foreground">–</TooltipTrigger>
        <TooltipContent>
          No return for this period. It needs money put in and a value at the end.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className={value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : undefined}>
      {formatPercent(value, { maximumFractionDigits: 1, signDisplay: 'exceptZero' })}
    </span>
  );
}
