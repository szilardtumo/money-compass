import { Separator } from '@/components/ui/separator';

import { CreateTransactionButton } from './_components/create-transaction-button';
import { TransactionsTable } from './_components/transactions-table';

export default function AccountDetailsPage() {
  return (
    <main>
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-xl font-bold mr-auto">Transactions</h1>
        <CreateTransactionButton />
      </div>
      <Separator />
      <div className="m-4 flex flex-col gap-4">
        <TransactionsTable />
      </div>
    </main>
  );
}
