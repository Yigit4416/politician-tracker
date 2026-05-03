import { hc } from "hono/client";
import type { ApiRoute } from "../../../src/index";
import { queryOptions } from "@tanstack/react-query";

const client = hc<ApiRoute>("/api");

export const api = client;

async function getPoliticians() {
  const res = await api.politician.$get();

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

async function getTrades() {
  const res = await api.trades.$get();

  if (!res.ok) {
    throw new Error(await res.text());
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
