'use client';

import React, { createContext, useCallback, useMemo, useState } from 'react';

import { capitalize } from '@/lib/utils/formatters';

interface ProviderProps {
  children: React.ReactNode;
}

interface ContextValue<DefaultFormValues> {
  isOpen: boolean;
  openDialog: (defaultValues?: DefaultFormValues) => void;
  internal: {
    defaultValues?: DefaultFormValues;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

export function createDialogContext<DefaultFormValues>(name: string) {
  const capitalizedName = capitalize(name);

  const Context = createContext<ContextValue<DefaultFormValues>>({
    isOpen: false,
    openDialog: () => {},
    internal: {
      setIsOpen: () => {},
    },
  });
  Object.defineProperty(Context, 'name', { value: `${capitalizedName}DialogContext` });
  Context.displayName = `${capitalizedName}DialogContext`;

  function Provider({ children }: ProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [defaultValues, setDefaultValues] = useState<DefaultFormValues>();

    const openDialog = useCallback((defaultFormValues?: DefaultFormValues) => {
      setIsOpen(true);
      setDefaultValues(defaultFormValues);
    }, []);

    const value = useMemo(() => {
      return {
        isOpen,
        openDialog,
        internal: {
          defaultValues,
          setIsOpen,
        },
      };
    }, [defaultValues, isOpen, openDialog]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }
  Object.defineProperty(Provider, 'name', { value: `${capitalizedName}DialogProvider` });

  function useDialog() {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error(`${useDialog.name} must be used within a ${Provider.name}`);
    }
    return context;
  }
  Object.defineProperty(useDialog, 'name', { value: `use${capitalizedName}Dialog` });

  return {
    Context,
    Provider,
    useDialog,
  };
}
