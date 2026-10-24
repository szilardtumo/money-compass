import { Skeleton } from '@/components/ui/skeleton';

// Keeps a suspending page inside the main panel, so it doesn't fall back to the root loading
// screen and unmount the resizable panels
export default function Loading() {
  return <Skeleton className="h-[360px]" />;
}
