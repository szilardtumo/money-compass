import { IdCardIcon } from '@radix-ui/react-icons';

import { Button } from '@/components/ui/button';
import {
  PlaceholderArea,
  PlaceholderAreaDescription,
  PlaceholderAreaTitle,
} from '@/components/ui/placeholder-area';

export function NoAccountsPlaceholder() {
  return (
    <PlaceholderArea>
      <IdCardIcon className="w-10 h-10 text-muted-foreground" />
      <PlaceholderAreaTitle>No accounts added</PlaceholderAreaTitle>
      <PlaceholderAreaDescription>
        You have not added any accounts. Add one below.
      </PlaceholderAreaDescription>
      <Button>Add account</Button>
    </PlaceholderArea>
  );
}
