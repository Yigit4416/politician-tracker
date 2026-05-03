import { Hono } from "hono";
import { db } from "../db";
import { issuerTable } from "../db/schema";
import { desc } from "drizzle-orm";

const issuerRoute = new Hono().get("/", async (c) => {
  try {
    const issuers = await db
      .select()
      .from(issuerTable)
      .orderBy(desc(issuerTable.issuerId));
    return c.json(issuers);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});

export default issuerRoute;
