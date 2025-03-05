'use client';

import { LinkIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Account } from '@/lib/types/accounts.types';
import { Integration } from '@/lib/types/integrations.types';

import { LinkIntegrationForm } from './LinkIntegrationForm';

interface LinkIntegrationButtonProps {
  accounts: Account[];
  integration: Integration;
  integrationAccountId: string;
}

export function LinkIntegrationDialogClient({
  accounts,
  integration,
  integrationAccountId,
}: LinkIntegrationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" icon={LinkIcon}>
          Link to subaccount
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link to subaccount</DialogTitle>
          <DialogDescription>
            Link the integration to a local subaccount to start syncing transactions automatically.
          </DialogDescription>
        </DialogHeader>
        <LinkIntegrationForm
          accounts={accounts}
          integration={integration}
          integrationAccountId={integrationAccountId}
          onSuccess={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
