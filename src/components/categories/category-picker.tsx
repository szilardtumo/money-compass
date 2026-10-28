'use client';

import { CheckIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Category, CategoryKind } from '@/lib/types/categories.types';

import { CategoryIcon } from './category-badge';

const GROUPS: { kind: CategoryKind; heading: string }[] = [
  { kind: 'expense', heading: 'Spending' },
  { kind: 'income', heading: 'Income' },
  { kind: 'excluded', heading: 'Excluded from analytics' },
];

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onSelect: (categoryId: string | null) => void;
  /** The trigger, usually a CategoryBadge */
  children: ReactNode;
  /** Adds an item on top that selects null, like "No category" */
  clearLabel?: string;
  /** Shown after picking a category, instead of selecting it right away */
  renderConfirm?: (categoryId: string, close: () => void) => ReactNode;
}

export function CategoryPicker({
  categories,
  value,
  onSelect,
  children,
  clearLabel,
  renderConfirm,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string>();

  const close = () => {
    setOpen(false);
    setPicked(undefined);
  };
  const select = (categoryId: string | null) => {
    if (categoryId && renderConfirm) {
      setPicked(categoryId);
    } else {
      onSelect(categoryId);
      close();
    }
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : close())}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {picked && renderConfirm ? (
          renderConfirm(picked, close)
        ) : (
          <Command>
            <CommandInput placeholder="Search categories..." className="h-9" />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              {clearLabel && (
                <>
                  <CommandGroup>
                    <CommandItem onSelect={() => select(null)}>{clearLabel}</CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              {GROUPS.map(({ kind, heading }) => (
                <CommandGroup key={kind} heading={heading}>
                  {categories
                    .filter((category) => category.kind === kind)
                    .map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => select(category.id)}
                      >
                        <CategoryIcon category={category} />
                        {category.name}
                        {value === category.id && <CheckIcon className="ml-auto size-4" />}
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
