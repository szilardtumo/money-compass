'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function IntegrationErrorToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      toast.error('Failed to connect the bank', { id: 'integration-error', description: error });
      router.replace(pathname);
    }
  }, [error, router, pathname]);

  return null;
}
