import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Statistics</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <Skeleton className="h-[360px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </PageContent>
    </PageLayout>
  );
}
