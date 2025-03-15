'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type PageHeaderSlotContextType = {
  container: HTMLDivElement | null;
  setContainer: (container: HTMLDivElement | null) => void;
};

const PageHeaderSlotContext = createContext<PageHeaderSlotContextType | null>(null);

const usePageHeaderSlot = () => {
  const context = useContext(PageHeaderSlotContext);

  if (!context) {
    throw new Error('usePageHeaderSlot must be used within a PageHeaderSlotProvider');
  }

  return context;
};

const PageHeaderSlotProvider = ({ children }: { children: React.ReactNode }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const value: PageHeaderSlotContextType = useMemo(
    () => ({ container, setContainer }),
    [container],
  );

  return <PageHeaderSlotContext.Provider value={value}>{children}</PageHeaderSlotContext.Provider>;
};

const PageHeaderSlot = () => {
  const { setContainer } = usePageHeaderSlot();

  return (
    <div
      className="flex items-center justify-between w-full h-full"
      ref={(node) => {
        setContainer(node);
      }}
    />
  );
};

const PageHeaderSlotContent = ({ children }: { children: React.ReactNode }) => {
  const { container } = usePageHeaderSlot();

  if (!container) {
    return null;
  }

  return createPortal(children, container);
};

export { PageHeaderSlotProvider, PageHeaderSlot, PageHeaderSlotContent };
