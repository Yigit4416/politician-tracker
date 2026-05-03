import { ArrowLeft } from "@phosphor-icons/react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
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

function formatChartDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
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

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);

      return () => {
        mediaQuery.removeEventListener("change", onStoreChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
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
  const isWideChart = useMediaQuery("(min-width: 640px)");
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
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link to="/all-trades">
              <ArrowLeft />
              Trades
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">
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
        <div className="space-y-5 sm:space-y-6">
          <section className="grid gap-3 border border-border bg-card p-3 text-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
            <div className="min-w-0">
              <div className="text-muted-foreground">Politician</div>
              <div className="break-words font-medium">
                {trade.politicianFirstName} {trade.politicianLastName}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-muted-foreground">Issuer</div>
              <div className="break-words font-medium">{trade.issuerName}</div>
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
              <section className="grid gap-2 min-[420px]:grid-cols-3 sm:gap-3">
                <PriceMetric title="Bought close" value={tradeClose} />
                <PriceMetric title="Published close" value={publishedClose} />
                <PriceMetric title="Current close" value={latestClose} />
              </section>

              <section className="grid gap-2 min-[420px]:grid-cols-3 sm:gap-3">
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

              <section className="min-w-0 overflow-hidden border border-border bg-card p-2.5 sm:p-4">
                <div className="mb-3 flex flex-col gap-1 sm:mb-4">
                  <h2 className="text-base font-semibold">
                    {ticker} closing price
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Includes two weeks before the trade date. The trade and
                    publish dates are marked on the chart.
                  </p>
                </div>

                {yahooQuery?.isLoading ? (
                  <div className="h-[18rem] content-center px-1 text-sm text-muted-foreground sm:h-80">
                    Loading chart...
                  </div>
                ) : yahooQuery?.isError ? (
                  <div className="h-[18rem] content-center px-1 text-sm text-destructive sm:h-80">
                    {yahooQuery.error.message}
                  </div>
                ) : (
                  <>
                    <ChartContainer
                      config={{
                        close: {
                          label: "Close",
                          color: "var(--chart-1)",
                        },
                      }}
                      className="h-[18rem] sm:h-80"
                    >
                      <LineChart
                        data={prices}
                        margin={
                          isWideChart
                            ? { left: 0, right: 10, top: 10, bottom: 2 }
                            : { left: 0, right: 4, top: 8, bottom: 0 }
                        }
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                          minTickGap={isWideChart ? 40 : 72}
                          tick={{ fontSize: isWideChart ? 10 : 9 }}
                          tickFormatter={formatChartDate}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={isWideChart ? 56 : 28}
                          tick={{ fontSize: isWideChart ? 10 : 9 }}
                          tickFormatter={(value) =>
                            typeof value === "number"
                              ? isWideChart
                                ? `$${value.toFixed(2)}`
                                : `${Math.round(value)}`
                              : String(value)
                          }
                          domain={["dataMin - 5", "dataMax + 5"]}
                        />
                        <Tooltip
                          cursor={{ strokeWidth: isWideChart ? 1 : 2 }}
                          content={<ChartTooltipContent labelFormatter={formatDate} />}
                        />
                        {tradePoint && tradeDate ? (
                          <ReferenceLine
                            x={tradePoint.date}
                            stroke="var(--chart-2)"
                            strokeDasharray="4 4"
                            label={
                              isWideChart
                                ? {
                                    value: "Trade",
                                    position: "insideTopLeft",
                                    fill: "var(--foreground)",
                                    fontSize: 10,
                                  }
                                : undefined
                            }
                          />
                        ) : null}
                        {publishedPoint && publishedDate ? (
                          <ReferenceLine
                            x={publishedPoint.date}
                            stroke="var(--chart-4)"
                            strokeDasharray="4 4"
                            label={
                              isWideChart
                                ? {
                                    value: "Published",
                                    position: "insideTopRight",
                                    fill: "var(--foreground)",
                                    fontSize: 10,
                                  }
                                : undefined
                            }
                          />
                        ) : null}
                        <Line
                          dataKey="close"
                          type="monotone"
                          stroke="var(--chart-1)"
                          strokeWidth={isWideChart ? 2 : 2.5}
                          dot={false}
                          activeDot={{ r: isWideChart ? 4 : 5 }}
                        />
                      </LineChart>
                    </ChartContainer>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-[11px] text-muted-foreground sm:hidden">
                      {tradePoint ? (
                        <ChartMarker color="var(--chart-2)" label="Trade date" />
                      ) : null}
                      {publishedPoint ? (
                        <ChartMarker
                          color="var(--chart-4)"
                          label="Published date"
                        />
                      ) : null}
                    </div>
                  </>
                )}
              </section>
            </>
          ) : (
            <section className="border border-border bg-card p-3 text-sm text-muted-foreground sm:p-4">
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
    <div className="min-w-0 border border-border bg-card p-3 sm:p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-2 text-base font-semibold sm:text-lg">
        {value.percent}
      </div>
      <div className="break-words text-[11px] text-muted-foreground sm:text-xs">
        {value.dollars} / share
      </div>
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
    <div className="min-w-0 border border-border bg-card p-3 sm:p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-2 break-words text-base font-semibold sm:text-lg">
        {formatMoney(value)}
      </div>
    </div>
  );
}

function ChartMarker({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-3 w-px" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
