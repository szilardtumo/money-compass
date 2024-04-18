import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Accounts</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <Skeleton className="h-[220px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </PageContent>
    </PageLayout>
  );
}
