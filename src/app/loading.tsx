import { Loader } from '@/components/ui/loader';

export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader />
    </div>
  );
}
