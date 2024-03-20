import { Separator } from '@/components/ui/separator';

export default function NotFound() {
  return (
    <main className="flex items-center justify-center h-screen gap-6">
      <h1 className="font-medium tracking-tight text-2xl">404</h1>
      <Separator decorative orientation="vertical" className="h-12" />
      <h2 className="text-sm">This page could not be found.</h2>
    </main>
  );
}
