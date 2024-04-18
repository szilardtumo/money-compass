import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Dashboard</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <Skeleton className="h-[360px]" />
        <Skeleton className="h-[220px]" />
        <Skeleton className="h-[400px]" />
      </PageContent>
    </PageLayout>
  );
}
