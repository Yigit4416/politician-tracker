import { ArrowLeft } from "@phosphor-icons/react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  tradeQueryOptions,
  yahooBetweenDatesQueryOptions,
} from "@/lib/api";

type PricePoint = {
  date: string;
  close: number;
};

function toDateOnly(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return toDateOnly(nextDate);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number | undefined) {
  if (value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatReturn(start: number | undefined, end: number | undefined) {
  if (start === undefined || end === undefined) {
    return { dollars: "-", percent: "-" };
  }

  const dollars = end - start;
  const percent = (dollars / start) * 100;

  return {
    dollars: `${dollars >= 0 ? "+" : ""}${formatMoney(dollars)}`,
    percent: `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`,
  };
}

function getPriceAtOrAfter(points: PricePoint[], date: string) {
  return points.find((point) => point.date >= date)?.close;
}

function getPointAtOrAfter(points: PricePoint[], date: string) {
  return points.find((point) => point.date >= date);
}

function getLatestPrice(points: PricePoint[]) {
  return points.at(-1)?.close;
}

function toPricePoints(data: Awaited<ReturnType<typeof fetch>> | unknown) {
  const yahooData = data as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
          }>;
        };
      }> | null;
    };
  };
  const result = yahooData.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  return timestamps.flatMap((timestamp, index) => {
    const close = closes[index];

    if (typeof close !== "number") {
      return [];
    }

    return [
      {
        date: toDateOnly(new Date(timestamp * 1000)),
        close,
      },
    ];
  });
}

export function TradeDetailPage() {
  const { tradeId } = useParams({ from: "/trades/$tradeId" });
  const tradeQuery = useQuery(tradeQueryOptions(tradeId));
  const trade = tradeQuery.data;
  const ticker = trade?.ticker?.trim() || undefined;
  const tradeDate = trade ? toDateOnly(trade.tradeDate) : undefined;
  const publishedDate = trade ? toDateOnly(trade.publishingDate) : undefined;
  const today = toDateOnly(new Date());
  const yahooBegin = tradeDate ? addDays(tradeDate, -14) : undefined;

  const yahooQuery = useQuery({
    ...yahooBetweenDatesQueryOptions({
      ticker: ticker ?? "",
      begin: yahooBegin ?? "1970-01-01",
      end: today,
    }),
    enabled: Boolean(ticker && tradeDate && yahooBegin),
  });

  const prices = yahooQuery?.data ? toPricePoints(yahooQuery.data) : [];
  const tradePoint = tradeDate ? getPointAtOrAfter(prices, tradeDate) : undefined;
  const publishedPoint = publishedDate
    ? getPointAtOrAfter(prices, publishedDate)
    : undefined;
  const tradeClose = tradeDate ? getPriceAtOrAfter(prices, tradeDate) : undefined;
  const publishedClose = publishedDate
    ? getPriceAtOrAfter(prices, publishedDate)
    : undefined;
  const latestClose = getLatestPrice(prices);
  const tradeToToday = formatReturn(tradeClose, latestClose);
  const publishedToToday = formatReturn(publishedClose, latestClose);
  const tradeToPublished = formatReturn(tradeClose, publishedClose);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link to="/all-trades">
              <ArrowLeft />
              Trades
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-normal">
            Trade Detail
          </h1>
        </div>
      </div>

      {tradeQuery.isLoading ? (
        <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading trade...
        </div>
      ) : tradeQuery.isError ? (
        <div className="border border-border bg-card p-6 text-sm text-destructive">
          {tradeQuery.error.message}
        </div>
      ) : trade ? (
        <div className="space-y-6">
          <section className="grid gap-3 border border-border bg-card p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Politician</div>
              <div className="font-medium">
                {trade.politicianFirstName} {trade.politicianLastName}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Issuer</div>
              <div className="font-medium">{trade.issuerName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Trade Date</div>
              <div className="font-medium">{formatDate(trade.tradeDate)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Published</div>
              <div className="font-medium">
                {formatDate(trade.publishingDate)}
              </div>
            </div>
          </section>

          {ticker ? (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <PriceMetric title="Bought close" value={tradeClose} />
                <PriceMetric title="Published close" value={publishedClose} />
                <PriceMetric title="Current close" value={latestClose} />
              </section>

              <section className="grid gap-3 sm:grid-cols-3">
                <ReturnMetric title="Trade to today" value={tradeToToday} />
                <ReturnMetric
                  title="Published to today"
                  value={publishedToToday}
                />
                <ReturnMetric
                  title="Trade to published"
                  value={tradeToPublished}
                />
              </section>

              <section className="border border-border bg-card p-4">
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-base font-semibold">
                    {ticker} closing price
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Includes two weeks before the trade date. The trade and
                    publish dates are marked on the chart.
                  </p>
                </div>

                {yahooQuery?.isLoading ? (
                  <div className="h-72 content-center text-sm text-muted-foreground">
                    Loading chart...
                  </div>
                ) : yahooQuery?.isError ? (
                  <div className="h-72 content-center text-sm text-destructive">
                    {yahooQuery.error.message}
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      close: {
                        label: "Close",
                        color: "var(--chart-1)",
                      },
                    }}
                    className="h-80"
                  >
                    <LineChart data={prices} margin={{ left: 8, right: 24 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={32}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          typeof value === "number"
                            ? `$${value.toFixed(2)}`
                            : String(value)
                        }
                        domain={["dataMin - 5", "dataMax + 5"]}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      {tradePoint && tradeDate ? (
                        <ReferenceLine
                          x={tradePoint.date}
                          stroke="var(--chart-2)"
                          strokeDasharray="4 4"
                          label={`Trade ${formatDate(tradeDate)}`}
                        />
                      ) : null}
                      {publishedPoint && publishedDate ? (
                        <ReferenceLine
                          x={publishedPoint.date}
                          stroke="var(--chart-4)"
                          strokeDasharray="4 4"
                          label={`Published ${formatDate(publishedDate)}`}
                        />
                      ) : null}
                      <Line
                        dataKey="close"
                        type="monotone"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </section>
            </>
          ) : (
            <section className="border border-border bg-card p-4 text-sm text-muted-foreground">
              No ticker is available for this issuer, so price history and
              return calculations are not shown.
            </section>
          )}
        </div>
      ) : null}
    </main>
  );
}

function ReturnMetric({
  title,
  value,
}: {
  title: string;
  value: { dollars: string; percent: string };
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-2 text-lg font-semibold">{value.percent}</div>
      <div className="text-xs text-muted-foreground">{value.dollars} / share</div>
    </div>
  );
}

function PriceMetric({
  title,
  value,
}: {
  title: string;
  value: number | undefined;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-2 text-lg font-semibold">{formatMoney(value)}</div>
    </div>
  );
}
