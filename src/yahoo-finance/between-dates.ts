import { Hono } from "hono";
import { z } from "zod";

import type { YahooFinanceTimeseriesType } from "./timeseries-interval-fetcher";

const yahooChartBaseUrl = "https://query1.finance.yahoo.com/v8/finance/chart";

const yyyyMmDdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD format");

export const betweenDatesParamsSchema = z
  .object({
    ticker: z
      .string()
      .trim()
      .min(1, "Ticker is required")
      .max(16, "Ticker is too long")
      .regex(/^[A-Za-z0-9.-]+$/, "Ticker contains invalid characters")
      .transform((ticker) => ticker.toUpperCase()),
    begin: yyyyMmDdSchema,
    end: yyyyMmDdSchema,
  })
  .refine(
    ({ begin, end }) => dateToUnixSeconds(begin) < dateToUnixSeconds(end),
    {
      message: "begin must be before end",
      path: ["end"],
    },
  );

export type BetweenDatesParams = z.input<typeof betweenDatesParamsSchema>;
export type BetweenDatesValidatedParams = z.output<
  typeof betweenDatesParamsSchema
>;
export type BetweenDatesResponse = YahooFinanceTimeseriesType;

export function dateToUnixSeconds(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
}

export async function fetchBetweenDates({
  ticker,
  begin,
  end,
}: BetweenDatesValidatedParams): Promise<BetweenDatesResponse> {
  const period1 = dateToUnixSeconds(begin);
  const period2 = dateToUnixSeconds(end);
  const url = new URL(`${yahooChartBaseUrl}/${ticker}`);

  url.searchParams.set("period1", String(period1));
  url.searchParams.set("period2", String(period2));
  url.searchParams.set("interval", "1d");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status}`);
  }

  return (await response.json()) as BetweenDatesResponse;
}

export const betweenDatesRoute = new Hono().get(
  "/between-dates/:ticker/:begin/:end",
  async (c) => {
    const params = betweenDatesParamsSchema.safeParse({
      ticker: c.req.param("ticker"),
      begin: c.req.param("begin"),
      end: c.req.param("end"),
    });

    if (!params.success) {
      return c.json(
        {
          error: "Invalid Yahoo Finance route params",
          issues: z.treeifyError(params.error),
        },
        400,
      );
    }

    try {
      const data = await fetchBetweenDates(params.data);
      return c.json(data, 200);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  },
);
