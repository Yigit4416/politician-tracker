import { ArrowLeft } from "@phosphor-icons/react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  type PointerEvent,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
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
  time: number;
  close: number;
};

type ChartSelection = {
  startTime: number;
  endTime: number;
};

function toDateOnly(value: string | Date | number) {
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return toDateOnly(nextDate);
}

function formatDate(value: string | Date | number) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatChartDate(value: string | Date | number) {
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

function dateOnlyToTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function getPriceAtOrAfter(points: PricePoint[], date: string) {
  const time = dateOnlyToTime(date);

  return points.find((point) => point.time >= time)?.close;
}

function getLatestPrice(points: PricePoint[]) {
  return points.at(-1)?.close;
}

function getClosestPricePoint(points: PricePoint[], time: number | undefined) {
  if (time === undefined) {
    return undefined;
  }

  return points.reduce<PricePoint | undefined>((closest, point) => {
    if (!closest) {
      return point;
    }

    return Math.abs(point.time - time) < Math.abs(closest.time - time)
      ? point
      : closest;
  }, undefined);
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
        date: toDateOnly(timestamp * 1000),
        time: timestamp * 1000,
        close,
      },
    ];
  });
}

export function TradeDetailPage() {
  const isWideChart = useMediaQuery("(min-width: 640px)");
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [selectionStartTime, setSelectionStartTime] = useState<number>();
  const [selectionActiveTime, setSelectionActiveTime] = useState<number>();
  const [chartSelection, setChartSelection] = useState<ChartSelection>();
  const { tradeId } = useParams({ from: "/trades/$tradeId" });
  const tradeQuery = useQuery(tradeQueryOptions(tradeId));
  const trade = tradeQuery.data;
  const ticker = trade?.ticker?.trim() || undefined;
  const tradeDate = trade ? toDateOnly(trade.tradeDate) : undefined;
  const publishedDate = trade ? toDateOnly(trade.publishingDate) : undefined;
  const today = toDateOnly(new Date());
  const yahooEnd = addDays(today, 1);
  const yahooBegin = tradeDate ? addDays(tradeDate, -14) : undefined;

  const yahooQuery = useQuery({
    ...yahooBetweenDatesQueryOptions({
      ticker: ticker ?? "",
      begin: yahooBegin ?? "1970-01-01",
      end: yahooEnd,
    }),
    enabled: Boolean(ticker && tradeDate && yahooBegin),
  });

  const prices = yahooQuery?.data ? toPricePoints(yahooQuery.data) : [];
  const tradeClose = tradeDate ? getPriceAtOrAfter(prices, tradeDate) : undefined;
  const publishedClose = publishedDate
    ? getPriceAtOrAfter(prices, publishedDate)
    : undefined;
  const latestClose = getLatestPrice(prices);
  const chartMinTime = Math.min(
    ...prices.map((point) => point.time),
    ...(tradeDate ? [dateOnlyToTime(tradeDate)] : []),
    ...(publishedDate ? [dateOnlyToTime(publishedDate)] : []),
  );
  const chartMaxTime = Math.max(
    ...prices.map((point) => point.time),
    ...(tradeDate ? [dateOnlyToTime(tradeDate)] : []),
    ...(publishedDate ? [dateOnlyToTime(publishedDate)] : []),
  );
  const tradeToToday = formatReturn(tradeClose, latestClose);
  const publishedToToday = formatReturn(publishedClose, latestClose);
  const tradeToPublished = formatReturn(tradeClose, publishedClose);
  const selectionPreview =
    selectionStartTime !== undefined && selectionActiveTime !== undefined
      ? {
          startTime: selectionStartTime,
          endTime: selectionActiveTime,
        }
      : chartSelection;
  const selectedStartTime =
    selectionPreview &&
    Math.min(selectionPreview.startTime, selectionPreview.endTime);
  const selectedEndTime =
    selectionPreview &&
    Math.max(selectionPreview.startTime, selectionPreview.endTime);
  const selectedStartPoint = getClosestPricePoint(prices, selectedStartTime);
  const selectedEndPoint = getClosestPricePoint(prices, selectedEndTime);
  const selectedReturn = formatReturn(
    selectedStartPoint?.close,
    selectedEndPoint?.close,
  );
  const selectedIsPositive =
    selectedStartPoint && selectedEndPoint
      ? selectedEndPoint.close >= selectedStartPoint.close
      : undefined;

  function getTimeFromPointer(clientX: number) {
    const chartWrapper = chartWrapperRef.current;

    if (!chartWrapper || !Number.isFinite(chartMinTime) || !Number.isFinite(chartMaxTime)) {
      return undefined;
    }

    const rect = chartWrapper.getBoundingClientRect();
    const yAxisWidth = isWideChart ? 56 : 28;
    const rightMargin = isWideChart ? 10 : 4;
    const left = rect.left + yAxisWidth;
    const width = rect.width - yAxisWidth - rightMargin;
    const ratio = Math.min(Math.max((clientX - left) / width, 0), 1);

    return chartMinTime + (chartMaxTime - chartMinTime) * ratio;
  }

  function handleChartPointerDown(event: PointerEvent<HTMLDivElement>) {
    const time = getTimeFromPointer(event.clientX);

    if (time === undefined) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectionStartTime(time);
    setSelectionActiveTime(time);
  }

  function handleChartPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (selectionStartTime === undefined) {
      return;
    }

    const time = getTimeFromPointer(event.clientX);

    if (time !== undefined) {
      setSelectionActiveTime(time);
    }
  }

  function handleChartPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (selectionStartTime === undefined) {
      return;
    }

    const endTime = getTimeFromPointer(event.clientX) ?? selectionActiveTime;

    if (
      endTime !== undefined &&
      getClosestPricePoint(prices, selectionStartTime)?.time !==
        getClosestPricePoint(prices, endTime)?.time
    ) {
      setChartSelection({ startTime: selectionStartTime, endTime });
    }

    setSelectionStartTime(undefined);
    setSelectionActiveTime(undefined);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
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
              <div className="text-muted-foreground">Publishing Date</div>
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
                  {selectedStartPoint && selectedEndPoint ? (
                    <div className="mt-2 flex flex-col gap-2 border border-border bg-background p-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-muted-foreground">
                          Selected range
                        </div>
                        <div className="font-medium">
                          {formatDate(selectedStartPoint.time)} to{" "}
                          {formatDate(selectedEndPoint.time)}
                        </div>
                      </div>
                      <div
                        className={[
                          "font-mono text-sm font-semibold",
                          selectedIsPositive
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-red-700 dark:text-red-300",
                        ].join(" ")}
                      >
                        {selectedReturn.percent} ({selectedReturn.dollars})
                      </div>
                      {chartSelection ? (
                        <Button
                          variant="outline"
                          size="xs"
                          className="w-fit"
                          onClick={() => setChartSelection(undefined)}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
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
                    <div
                      ref={chartWrapperRef}
                      className="touch-none select-none"
                      onPointerDown={handleChartPointerDown}
                      onPointerMove={handleChartPointerMove}
                      onPointerUp={handleChartPointerUp}
                      onPointerCancel={() => {
                        setSelectionStartTime(undefined);
                        setSelectionActiveTime(undefined);
                      }}
                    >
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
                            dataKey="time"
                            type="number"
                            domain={[chartMinTime, chartMaxTime]}
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
                            content={
                              <ChartTooltipContent labelFormatter={formatDate} />
                            }
                          />
                          {selectedStartTime !== undefined &&
                          selectedEndTime !== undefined ? (
                            <ReferenceArea
                              x1={selectedStartTime}
                              x2={selectedEndTime}
                              stroke="var(--chart-1)"
                              fill="var(--chart-1)"
                              fillOpacity={0.12}
                              className="pointer-events-none"
                            />
                          ) : null}
                          {tradeDate ? (
                            <ReferenceLine
                              x={dateOnlyToTime(tradeDate)}
                              stroke="var(--chart-2)"
                              strokeDasharray="4 4"
                              className="pointer-events-none"
                              label={
                                isWideChart
                                  ? {
                                      value: "Trade",
                                      position: "insideTopLeft",
                                      fill: "var(--foreground)",
                                      fontSize: 10,
                                      className: "pointer-events-none",
                                    }
                                  : undefined
                              }
                            />
                          ) : null}
                          {publishedDate ? (
                            <ReferenceLine
                              x={dateOnlyToTime(publishedDate)}
                              stroke="var(--chart-4)"
                              strokeDasharray="4 4"
                              className="pointer-events-none"
                              label={
                                isWideChart
                                  ? {
                                      value: "Published",
                                      position: "insideTopRight",
                                      fill: "var(--foreground)",
                                      fontSize: 10,
                                      className: "pointer-events-none",
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
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-[11px] text-muted-foreground sm:hidden">
                      {tradeDate ? (
                        <ChartMarker color="var(--chart-2)" label="Trade date" />
                      ) : null}
                      {publishedDate ? (
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
