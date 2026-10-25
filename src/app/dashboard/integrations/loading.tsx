import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <Skeleton className="h-[300px]" />
      <Skeleton className="h-[300px]" />
    </>
  );
}
