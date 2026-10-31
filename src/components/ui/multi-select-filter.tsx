'use client';

import { cn } from 'cn';
import { CheckIcon, CirclePlusIcon, MinusIcon } from 'lucide-react';
import { ComponentType } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { groupBy } from '@/lib/utils/group-by';

interface MultiSelectFilterOption {
  label: string;
  value: string;
  /** Options of a group are listed under a checkbox that selects all of them */
  group?: string;
  icon?: ComponentType<{ className?: string }>;
}

interface MultiSelectFilterProps {
  title: string;
  options: MultiSelectFilterOption[];
  /** No selected value means no filter */
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  /** The number of items per value, shown next to the options */
  counts?: Map<string, number>;
  className?: string;
}

function Check({ state }: { state: boolean | 'some' }) {
  return (
    <div
      className={cn(
        'mr-2 rounded-sm border border-primary',
        state ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
      )}
    >
      {state === 'some' ? <MinusIcon className="size-4" /> : <CheckIcon className="size-4" />}
    </div>
  );
}

/**
 * A button that opens a searchable list of checkboxes. Grouped options, like the subaccounts of an
 * account, get a checkbox for the whole group, and a group with one option shows only that.
 */
export function MultiSelectFilter({
  title,
  options,
  selected,
  onSelectedChange,
  counts,
  className,
}: MultiSelectFilterProps) {
  const selectedValues = new Set(selected);
  const labelOf = (option: MultiSelectFilterOption) =>
    option.group ? `${option.group} ${option.label}` : option.label;
  const setSelected = (values: string[], isSelected: boolean) =>
    onSelectedChange(
      isSelected
        ? [...new Set([...selected, ...values])]
        : selected.filter((value) => !values.includes(value)),
    );
  const countOf = (values: string[]) =>
    counts && values.reduce((total, value) => total + (counts.get(value) ?? 0), 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          icon={CirclePlusIcon}
          className={cn('border-dashed', className)}
        >
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {labelOf(option)}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupBy(options, (option) => option.group ?? '')).map(
              ([group, items]) => {
                const values = items.map((item) => item.value);
                const selectedCount = values.filter((value) => selectedValues.has(value)).length;
                const isGrouped = !!group && items.length > 1;

                return (
                  <CommandGroup key={group}>
                    {isGrouped && (
                      <CommandItem
                        value={group}
                        onSelect={() => setSelected(values, selectedCount < values.length)}
                      >
                        <Check
                          state={selectedCount === values.length || (selectedCount > 0 && 'some')}
                        />
                        <span className="font-medium">{group}</span>
                        <CommandShortcut className="tracking-normal">
                          {countOf(values)}
                        </CommandShortcut>
                      </CommandItem>
                    )}
                    {items.map((option) => {
                      const isSelected = selectedValues.has(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          // Searching for the group finds its options too
                          value={labelOf(option)}
                          className={cn(isGrouped && 'pl-6')}
                          onSelect={() => setSelected([option.value], !isSelected)}
                        >
                          <Check state={isSelected} />
                          {option.icon && <option.icon className="mr-2 text-muted-foreground" />}
                          <span>{group && !isGrouped ? group : option.label}</span>
                          <CommandShortcut className="tracking-normal">
                            {countOf([option.value])}
                          </CommandShortcut>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                );
              },
            )}
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onSelectedChange([])}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
