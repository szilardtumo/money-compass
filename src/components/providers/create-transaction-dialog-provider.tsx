'use client';

import React, { ComponentProps, createContext, useMemo, useState } from 'react';

import type { CreateTransactionForm } from '@/components/dialogs/create-transaction-dialog/create-transaction-form';

type DefaultValues = ComponentProps<typeof CreateTransactionForm>['defaultValues'];

interface CreateTransactionDialogContextValue {
  isOpen: boolean;
  openCreateTransactionDialog: (defaultValues?: DefaultValues) => void;
  internal: {
    defaultValues?: DefaultValues;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

const CreateTransactionDialogContext = createContext<CreateTransactionDialogContextValue>({
  isOpen: false,
  openCreateTransactionDialog: () => {},
  internal: {
    setIsOpen: () => {},
  },
});

function useCreateTransactionDialog() {
  const context = React.useContext(CreateTransactionDialogContext);
  if (context === undefined) {
    throw new Error(
      'useCreateTransactionDialog must be used within a CreateTransactionDialogProvider',
    );
  }
  return context;
}

interface CreateTransactionDialogProviderProps {
  children: React.ReactNode;
}

function CreateTransactionDialogProvider({ children }: CreateTransactionDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<DefaultValues>();

  const value = useMemo(() => {
    return {
      isOpen,
      openCreateTransactionDialog: (defaultFormValues?: DefaultValues) => {
        setIsOpen(true);
        setDefaultValues(defaultFormValues);
      },
      internal: {
        defaultValues,
        setIsOpen,
      },
    };
  }, [defaultValues, isOpen]);

  return (
    <CreateTransactionDialogContext.Provider value={value}>
      {children}
    </CreateTransactionDialogContext.Provider>
  );
}

export { CreateTransactionDialogProvider, useCreateTransactionDialog };
