import { notFound } from 'next/navigation';

import { getSimpleAccount } from '@/lib/db/accounts.queries';

interface AccountDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function AccountDetailsPage({ params }: AccountDetailsPageProps) {
  const account = await getSimpleAccount(params.id);

  if (!account) {
    notFound();
  }

  return <main>{params.id}</main>;
}
