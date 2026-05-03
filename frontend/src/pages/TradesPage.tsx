import { CaretUpDown } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/DataTable";
import { tradesQueryOptions } from "@/lib/api";

type TradeRow = {
  tradeId: number;
  traderId: string;
  politicianFirstName: string;
  politicianLastName: string;
  issuerId: string;
  issuerName: string;
  publishingDate: string | Date;
  tradeDate: string | Date;
  reportingGap: number;
  type: string;
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const columns: ColumnDef<TradeRow>[] = [
  {
    accessorKey: "tradeId",
    header: "Trade ID",
    cell: ({ row }) => (
      <span className="font-mono">{row.original.tradeId}</span>
    ),
  },
  {
    id: "politicianName",
    accessorFn: (row) => `${row.politicianFirstName} ${row.politicianLastName}`,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Politician
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.politicianFirstName} {row.original.politicianLastName}
      </span>
    ),
  },
  {
    accessorKey: "issuerName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Issuer
        <CaretUpDown />
      </Button>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "tradeDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Trade Date
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.original.tradeDate),
  },
  {
    accessorKey: "reportingGap",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Reporting Gap
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => `${row.original.reportingGap} days`,
  },
];

export function TradesPage() {
  const query = useQuery(tradesQueryOptions);
  const trades = (query.data ?? []) as TradeRow[];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">Trades</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review the most recent tracked congressional trades.
        </p>
      </div>

      {query.isLoading ? (
        <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading trades...
        </div>
      ) : query.isError ? (
        <div className="border border-border bg-card p-6 text-sm text-destructive">
          {query.error.message}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={trades}
          emptyMessage="No trades found."
          filterColumn="politicianName"
          filterPlaceholder="Filter by politician..."
        />
      )}
    </main>
  );
}
