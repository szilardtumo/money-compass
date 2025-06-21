import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <Skeleton className="h-[100px]" />
      <Skeleton className="h-[360px]" />
      <Skeleton className="h-[500px]" />
      <Skeleton className="h-[500px]" />
    </>
  );
}
