import { notFound } from 'next/navigation';

import { AccountDetailsCard } from '@/components/cards/account-details-card';
import { AccountHistoryCard } from '@/components/cards/account-history-card';
import { Separator } from '@/components/ui/separator';
import { getSimpleAccount } from '@/lib/db/accounts.queries';
import { getTransactionHistory } from '@/lib/db/transactions.queries';

interface AccountDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const [account, transactionHistory] = await Promise.all([
    getSimpleAccount(params.id),
    getTransactionHistory('12 month', '1 month'),
  ]);

  if (!account) {
    notFound();
  }

  return (
    <main>
      <div className="flex items-center px-4 h-14">
        <h1 className="text-xl font-bold">{account.name}</h1>
      </div>
      <Separator />
      <div className="m-4 flex flex-col gap-4">
        <AccountDetailsCard account={account} />
        <AccountHistoryCard
          data={transactionHistory}
          account={account}
          title="Transaction history (past 12 months)"
        />
      </div>
    </main>
  );
}
