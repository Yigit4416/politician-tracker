import { Hono } from "hono";
import { db } from "../db";
import { politiciansTable, tradesTable } from "../db/schema";
import { count, desc, eq, max } from "drizzle-orm";

export const politicianRoute = new Hono()
  .get("/politician-trades", async (c) => {
    try {
      const politicianId = c.req.param("politicianId");

      if (politicianId === undefined) {
        return c.json({ error: "politicianId is required" }, 400);
      }

      const trades = await db
        .select()
        .from(tradesTable)
        .where(eq(tradesTable.traderId, politicianId));

      return c.json(trades);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  })
  .get("/party", async (c) => {
    try {
      const party = c.req.query("party");
      if (party === undefined) {
        return c.json({ error: "party is required" }, 400);
      }

      const politicians = await db
        .select()
        .from(politiciansTable)
        .where(eq(politiciansTable.party, party));

      return c.json(politicians, 200);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  })
  .get("/", async (c) => {
    try {
      const politicians = await db
        .select({
          id: politiciansTable.id,
          chamber: politiciansTable.chamber,
          firstName: politiciansTable.firstName,
          lastName: politiciansTable.lastName,
          party: politiciansTable.party,
          tradeCount: count(tradesTable.tradeId),
          lastTradeDate: max(tradesTable.tradeDate),
        })
        .from(politiciansTable)
        .leftJoin(tradesTable, eq(tradesTable.traderId, politiciansTable.id))
        .groupBy(
          politiciansTable.id,
          politiciansTable.chamber,
          politiciansTable.firstName,
          politiciansTable.lastName,
          politiciansTable.party,
        )
        .orderBy(desc(max(tradesTable.tradeDate)));

      return c.json(politicians, 200);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });
