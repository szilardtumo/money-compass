import { PageContent, PageHeader, PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout>
      <PageHeader>
        <Skeleton className="h-6 w-[150px]" />
      </PageHeader>

      <PageContent>
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[360px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </PageContent>
    </PageLayout>
  );
}
