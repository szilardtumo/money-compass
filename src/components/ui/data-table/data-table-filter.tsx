'use no memo';

import { ReactTable, RowData } from '@tanstack/react-table';
import { ComponentProps } from 'react';

import { MultiSelectFilter } from '@/components/ui/multi-select-filter';

import { DataTableFeatures } from './use-data-table';

interface DataTableFilterProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  columnId: string;
  title: string;
  options: ComponentProps<typeof MultiSelectFilter>['options'];
  className?: string;
}

export function DataTableFilter<TData extends RowData>({
  table,
  columnId,
  title,
  options,
  className,
}: DataTableFilterProps<TData>) {
  // The column object is stable across state changes, so the compiler would cache its reads.
  // Taking `table` (new on every change) re-renders this component, and 'use no memo' re-reads them.
  const column = table.getColumn(columnId)!;

  return (
    <MultiSelectFilter
      title={title}
      options={options}
      selected={(column.getFilterValue() as string[] | undefined) ?? []}
      onSelectedChange={(values) => column.setFilterValue(values.length ? values : undefined)}
      counts={column.getFacetedUniqueValues()}
      className={className}
    />
  );
}
