import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <Skeleton className="w-36 h-9" />
      <Skeleton className="w-full h-72" />
    </>
  );
}
