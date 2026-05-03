import { hc } from "hono/client";
import type { ApiRoute } from "../../../src/index";
import { queryOptions } from "@tanstack/react-query";

const client = hc<ApiRoute>("/api");

export const api = client;

async function errorFromResponse(response: Response) {
  const text = await response.text();

  try {
    const data = JSON.parse(text) as { error?: unknown };

    if (typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Fall through to the raw response text.
  }

  return text || response.statusText;
}

async function getPoliticians() {
  const res = await api.politician.$get();

  if (!res.ok) {
    throw new Error(await errorFromResponse(res));
  }

  return res.json();
}

async function getTrades() {
  const res = await api.trades.$get();

  if (!res.ok) {
    throw new Error(await errorFromResponse(res));
  }

  return res.json();
}

async function getTrade(tradeId: string) {
  const res = await api.trades[":tradeId"].$get({
    param: {
      tradeId,
    },
  });

  if (!res.ok) {
    throw new Error(await errorFromResponse(res));
  }

  return res.json();
}

async function getYahooBetweenDates({
  ticker,
  begin,
  end,
}: {
  ticker: string;
  begin: string;
  end: string;
}) {
  const res = await api.yahoo["between-dates"][":ticker"][":begin"][
    ":end"
  ].$get({
    param: {
      ticker,
      begin,
      end,
    },
  });

  if (!res.ok) {
    throw new Error(await errorFromResponse(res));
  }

  return res.json();
}

export const politicianQueryOptions = queryOptions({
  queryKey: ["politicians"],
  queryFn: getPoliticians,
  staleTime: 1000 * 60 * 60,
});

export const tradesQueryOptions = queryOptions({
  queryKey: ["trades"],
  queryFn: getTrades,
  staleTime: 1000 * 60 * 5,
});

export function tradeQueryOptions(tradeId: string) {
  return queryOptions({
    queryKey: ["trades", tradeId],
    queryFn: () => getTrade(tradeId),
    staleTime: 1000 * 60 * 5,
  });
}

export function yahooBetweenDatesQueryOptions(params: {
  ticker: string;
  begin: string;
  end: string;
}) {
  return queryOptions({
    queryKey: ["yahoo", "between-dates", params],
    queryFn: () => getYahooBetweenDates(params),
    staleTime: 1000 * 60 * 15,
  });
}
