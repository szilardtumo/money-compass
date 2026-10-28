'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IntegrationSyncLog } from '@/lib/types/integrations.types';
import { formatCurrency } from '@/lib/utils/formatters';

import { RelativeTime } from './relative-time';

interface SyncHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: IntegrationSyncLog[];
  currency: string;
}

export function SyncHistoryDialog({ open, onOpenChange, logs, currency }: SyncHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sync history</DialogTitle>
          <DialogDescription>The recent syncs of this bank account.</DialogDescription>
        </DialogHeader>
        {logs.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Started by</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <RelativeTime date={log.createdAt} />
                  </TableCell>
                  <TableCell>{log.trigger === 'cron' ? 'Daily sync' : 'You'}</TableCell>
                  <TableCell className="whitespace-normal">
                    {log.error ? (
                      <span className="text-destructive">Failed: {log.error}</span>
                    ) : (
                      <>
                        {log.importedCount} new transaction{log.importedCount === 1 ? '' : 's'}
                        {log.correctionAmount !== null &&
                          `, correction of ${formatCurrency(log.correctionAmount, currency)}`}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">This bank account hasn&apos;t synced yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
