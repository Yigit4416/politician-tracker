import { CaretUpDown } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { politicianQueryOptions } from "@/lib/api";

type PoliticianRow = {
  id: string;
  chamber: string;
  firstName: string;
  lastName: string;
  party: string;
  tradeCount: number;
  lastTradeDate: string | Date | null;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No trades";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const columns: ColumnDef<PoliticianRow>[] = [
  {
    id: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <Button asChild variant="link" size="sm" className="font-medium">
        <Link to="/all-trades" search={{ politician: row.original.id }}>
          {row.original.firstName} {row.original.lastName}
        </Link>
      </Button>
    ),
  },
  {
    accessorKey: "party",
    header: "Party",
  },
  {
    accessorKey: "chamber",
    header: "Chamber",
  },
  {
    accessorKey: "tradeCount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Trades
        <CaretUpDown />
      </Button>
    ),
  },
  {
    accessorKey: "lastTradeDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Last Trade
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.original.lastTradeDate),
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">{row.original.id}</span>
    ),
  },
];

export function PoliticiansPage() {
  const query = useQuery(politicianQueryOptions);
  const politicians = (query.data ?? []) as PoliticianRow[];

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">
          Politicians
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse tracked politicians and their basic filing metadata.
        </p>
      </div>

      {query.isLoading ? (
        <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading politicians...
        </div>
      ) : query.isError ? (
        <div className="border border-border bg-card p-6 text-sm text-destructive">
          {query.error.message}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={politicians}
          emptyMessage="No politicians found."
          filterColumn="name"
          filterPlaceholder="Filter politicians..."
          mobileLabels={{
            name: "Name",
            party: "Party",
            chamber: "Chamber",
            tradeCount: "Trades",
            lastTradeDate: "Last Trade",
            id: "ID",
          }}
        />
      )}
    </main>
  );
}
