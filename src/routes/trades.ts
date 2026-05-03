import { Hono } from "hono";
import { db } from "../db";
import { issuerTable, politiciansTable, tradesTable } from "../db/schema";
import { desc, eq } from "drizzle-orm";

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
    .orderBy(desc(tradesTable.tradeDate));
}

export const tradesRoute = new Hono().get("/", async (c) => {
  try {
    const allTrades = await getAllTrades();
    return c.json(allTrades);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
}).get("/all-trades", async (c) => {
  try {
    const allTrades = await getAllTrades();
    return c.json(allTrades);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
