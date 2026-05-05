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
        className="-ml-2.5 justify-start"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Politician
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <Button asChild variant="link" size="sm" className="font-medium">
        <Link
          to="/all-trades"
          search={{ politician: row.original.traderId }}
        >
          {row.original.politicianFirstName} {row.original.politicianLastName}
        </Link>
      </Button>
    ),
  },
  {
    accessorKey: "issuerName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2.5 justify-start"
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
    cell: ({ row }) => {
      const normalizedType = row.original.type.toLowerCase();
      const isBuy = normalizedType.includes("buy");
      const isSell = normalizedType.includes("sell");

      return (
        <span
          className={[
            "inline-flex h-7 items-center border px-2 text-xs font-medium",
            isBuy
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : isSell
                ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                : "border-border bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {row.original.type}
        </span>
      );
    },
  },
  {
    id: "publishingDate",
    accessorFn: (row) => new Date(row.publishingDate).getTime(),
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Publishing Date
        <CaretUpDown />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.original.publishingDate),
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

type TradesPageProps = {
  politicianId?: string;
};

export function TradesPage({ politicianId }: TradesPageProps = {}) {
  const query = useQuery(tradesQueryOptions);
  const allTrades = (query.data ?? []) as TradeRow[];
  const trades = politicianId
    ? allTrades.filter((trade) => trade.traderId === politicianId)
    : allTrades;
  const selectedPolitician = trades[0]
    ? `${trades[0].politicianFirstName} ${trades[0].politicianLastName}`
    : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">
          Trades
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {selectedPolitician
            ? `Review all tracked trades for ${selectedPolitician}.`
            : "Review the most recent tracked congressional trades."}
        </p>
        {politicianId ? (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link to="/all-trades">Show all trades</Link>
          </Button>
        ) : null}
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
          initialSorting={[{ id: "publishingDate", desc: true }]}
          mobileLabels={{
            tradeId: "Trade ID",
            politicianName: "Politician",
            issuerName: "Issuer",
            type: "Type",
            publishingDate: "Publishing Date",
            reportingGap: "Reporting Gap",
          }}
        />
      )}
    </main>
  );
}
