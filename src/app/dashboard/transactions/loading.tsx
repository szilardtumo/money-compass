import { PageContent, PageHeader, PageHeaderTitle, PageLayout } from '@/components/ui/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout>
      <PageHeader>
        <PageHeaderTitle>Transactions</PageHeaderTitle>
      </PageHeader>

      <PageContent>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="ml-auto h-8 w-[100px]" />
          </div>
          <Skeleton className="h-[650px] w-full" />
          <Skeleton className="h-4 w-[160px]" />
        </div>
      </PageContent>
    </PageLayout>
  );
}
