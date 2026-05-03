import { CaretUpDown } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
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
      <Button asChild variant="link" size="sm" className="font-mono">
        <Link
          to="/trades/$tradeId"
          params={() => ({ tradeId: String(row.original.tradeId) })}
        >
          {row.original.tradeId}
        </Link>
      </Button>
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
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">
          Trades
        </h1>
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
          mobileLabels={{
            tradeId: "Trade ID",
            politicianName: "Politician",
            issuerName: "Issuer",
            type: "Type",
            tradeDate: "Trade Date",
            reportingGap: "Reporting Gap",
          }}
        />
      )}
    </main>
  );
}
