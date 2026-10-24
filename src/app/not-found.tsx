import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="text-muted-foreground">The page you are looking for doesn&apos;t exist.</p>
      <Link href="/dashboard" className={buttonVariants({ className: 'mt-4' })}>
        Go to the dashboard
      </Link>
    </div>
  );
}
