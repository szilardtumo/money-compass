'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function IntegrationErrorToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace(pathname);
    }
  }, [error, router, pathname]);

  return null;
}
