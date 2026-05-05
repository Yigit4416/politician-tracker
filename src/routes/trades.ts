import { Hono } from "hono";
import { db } from "../db";
import { issuerTable, politiciansTable, tradesTable } from "../db/schema";
import { desc, eq } from "drizzle-orm";

function normalizeTicker(ticker: string | null) {
  const normalized = ticker?.trim().split(":")[0]?.trim().toUpperCase();

  return normalized ? normalized : null;
}

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause =
    error.cause instanceof Error
      ? error.cause.message
      : typeof error.cause === "string"
        ? error.cause
        : undefined;

  return cause ? `${error.message}\nCause: ${cause}` : error.message;
}

async function getAllTrades() {
  return db
    .select({
      tradeId: tradesTable.tradeId,
      traderId: tradesTable.traderId,
      politicianFirstName: politiciansTable.firstName,
      politicianLastName: politiciansTable.lastName,
      issuerId: tradesTable.issuerId,
      issuerName: issuerTable.issuerName,
      publishingDate: tradesTable.publishingDate,
      tradeDate: tradesTable.tradeDate,
      reportingGap: tradesTable.reportingGap,
      type: tradesTable.type,
    })
    .from(tradesTable)
    .innerJoin(politiciansTable, eq(politiciansTable.id, tradesTable.traderId))
    .innerJoin(issuerTable, eq(issuerTable.issuerId, tradesTable.issuerId))
    .orderBy(desc(tradesTable.publishingDate));
}

async function getTradeById(tradeId: number) {
  const [trade] = await db
    .select({
      tradeId: tradesTable.tradeId,
      traderId: tradesTable.traderId,
      politicianFirstName: politiciansTable.firstName,
      politicianLastName: politiciansTable.lastName,
      issuerId: tradesTable.issuerId,
      issuerName: issuerTable.issuerName,
      ticker: issuerTable.ticker,
      publishingDate: tradesTable.publishingDate,
      tradeDate: tradesTable.tradeDate,
      reportingGap: tradesTable.reportingGap,
      type: tradesTable.type,
    })
    .from(tradesTable)
    .innerJoin(politiciansTable, eq(politiciansTable.id, tradesTable.traderId))
    .innerJoin(issuerTable, eq(issuerTable.issuerId, tradesTable.issuerId))
    .where(eq(tradesTable.tradeId, tradeId));

  if (!trade) {
    return undefined;
  }

  return {
    ...trade,
    ticker: normalizeTicker(trade.ticker),
  };
}

export const tradesRoute = new Hono()
  .get("/", async (c) => {
    try {
      const allTrades = await getAllTrades();
      return c.json(allTrades);
    } catch (error) {
      return c.json({ error: errorMessage(error) }, 500);
    }
  })
  .get("/all-trades", async (c) => {
    try {
      const allTrades = await getAllTrades();
      return c.json(allTrades);
    } catch (error) {
      return c.json({ error: errorMessage(error) }, 500);
    }
  })
  .get("/:tradeId", async (c) => {
    const tradeId = Number(c.req.param("tradeId"));

    if (!Number.isInteger(tradeId) || tradeId <= 0) {
      return c.json({ error: "tradeId must be a positive integer" }, 400);
    }

    try {
      const trade = await getTradeById(tradeId);

      if (!trade) {
        return c.json({ error: "Trade not found" }, 404);
      }

      return c.json(trade);
    } catch (error) {
      return c.json({ error: errorMessage(error) }, 500);
    }
  });
