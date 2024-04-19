'use client';

import 'nprogress/nprogress.css';
import nProgress from 'nprogress';
import { useEffect } from 'react';

import { useLoading } from '@/components/providers/loading-provider';

nProgress.configure({ showSpinner: false });

export function GlobalProgress() {
  const { isLoading } = useLoading();

  useEffect(() => {
    if (isLoading) {
      nProgress.start();
    } else {
      nProgress.done();
    }
  }, [isLoading]);

  return null;
}
