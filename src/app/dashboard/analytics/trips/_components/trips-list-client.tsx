'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CategoryBadge } from '@/components/categories/category-badge';
import { useDrawerHref } from '@/components/drawers/drawer-link';
import { useNavigate } from '@/components/navigation-progress';
import { TripDialog } from '@/components/trips/trip-dialog';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  DataTableGlobalFilter,
  useDataTable,
  type DataTableFeatures,
} from '@/components/ui/data-table';
import { Category } from '@/lib/types/categories.types';
import { Trip } from '@/lib/types/trips.types';
import { formatCurrency, formatDateRange } from '@/lib/utils/formatters';

const columnHelper = createColumnHelper<DataTableFeatures, Trip>();

interface TripsListClientProps {
  trips: Trip[];
  categories: Category[];
  mainCurrency: string;
}

export function TripsListClient({ trips, categories, mainCurrency }: TripsListClientProps) {
  const navigate = useNavigate();
  const getDrawerHref = useDrawerHref();
  const [isCreating, setIsCreating] = useState(false);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          header: 'Trip',
          cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        }),
        columnHelper.accessor('startDate', {
          header: 'Dates',
          enableGlobalFilter: false,
          cell: ({ row }) => (
            <span className="whitespace-nowrap">
              {formatDateRange(row.original.startDate, row.original.endDate)}
            </span>
          ),
        }),
        columnHelper.accessor((row) => row.category?.name ?? '', {
          id: 'category',
          header: 'Category',
          enableGlobalFilter: false,
          cell: ({ row }) =>
            row.original.category && <CategoryBadge category={row.original.category} />,
        }),
        columnHelper.accessor('transactionCount', {
          header: 'Transactions',
          enableGlobalFilter: false,
          meta: { align: 'right' },
        }),
        // Spending is negative, so the most expensive trips sort first
        columnHelper.accessor((row) => -row.total, {
          id: 'cost',
          header: 'Cost',
          enableGlobalFilter: false,
          meta: { align: 'right' },
          cell: ({ getValue }) => (
            <span className="font-medium whitespace-nowrap">
              {formatCurrency(getValue(), mainCurrency, { maximumFractionDigits: 0 })}
            </span>
          ),
        }),
      ]),
    [mainCurrency],
  );

  const table = useDataTable({
    columns,
    getRowId: (row) => row.id,
    data: trips,
    enableSorting: true,
    initialSorting: [{ id: 'startDate', desc: true }],
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <DataTableGlobalFilter table={table} className="sm:w-56" />
        <Button icon={PlusIcon} className="sm:ml-auto" onClick={() => setIsCreating(true)}>
          New trip
        </Button>
      </div>

      <DataTable
        table={table}
        emptyMessage="No trips yet. Select transactions on the Transactions page and add them to a new trip."
        onRowClick={(trip) => navigate(getDrawerHref({ trip: trip.id }))}
      />

      <TripDialog
        open={isCreating}
        categories={categories}
        onClose={() => setIsCreating(false)}
        onSaved={(tripId) => navigate(getDrawerHref({ trip: tripId }))}
      />
    </div>
  );
}
