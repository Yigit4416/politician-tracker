import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { issuerTable, politiciansTable, tradesTable } from "./db/schema";
import { fetchPoliticianTrades } from "./scraper";
import type { FetchPoliticianTradesResult } from "./scraper";
import { logger } from "hono/logger";
import { politicianRoute } from "./routes/politician";
import { tradesRoute } from "./routes/trades";
import { serveStatic } from "hono/bun";
import yahooRouter from "./routes/yahoo";

const app = new Hono();

app.use("*", logger());

const apiRoutes = new Hono()
  .route("/politician", politicianRoute)
  .route("/trades", tradesRoute)
  .route("/yahoo", yahooRouter);

export type ApiRoute = typeof apiRoutes; // To use in frontend without problem

app.route("/api", apiRoutes);

app.get("/health", (c) => c.json({ ok: true }));

app.get("*", serveStatic({ root: "frontend/dist" }));
app.get("*", serveStatic({ path: "frontend/dist/index.html" }));

const DEFAULT_SCRAPE_INTERVAL_MINUTES = 24 * 60;

function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function excluded(column: { name: string }) {
  return sql`excluded.${sql.identifier(column.name)}`;
}

async function insertPoliticianTrades(result: FetchPoliticianTradesResult) {
  const politicians = new Map<string, typeof politiciansTable.$inferInsert>();
  const issuers = new Map<string, typeof issuerTable.$inferInsert>();
  const trades = new Map<number, typeof tradesTable.$inferInsert>();

  for (const politicianTrades of result.politicians) {
    politicians.set(politicianTrades.id, {
      id: politicianTrades.id,
      chamber: politicianTrades.politician.chamber ?? "",
      firstName: politicianTrades.politician.firstName,
      lastName: politicianTrades.politician.lastName,
      party: politicianTrades.politician.party ?? "",
    });

    for (const trade of politicianTrades.trades) {
      const issuerId = String(trade._issuerId);

      issuers.set(issuerId, {
        issuerId,
        country: trade.issuer.country ?? "",
        ticker: trade.issuer.issuerTicker ?? "",
        issuerName: trade.issuer.issuerName,
        sector: trade.issuer.sector,
      });

      trades.set(trade._txId, {
        tradeId: trade._txId,
        traderId: trade._politicianId,
        issuerId,
        publishingDate: new Date(trade.pubDate),
        tradeDate: new Date(trade.txDate),
        reportingGap: trade.reportingGap ?? 0,
        type: trade.txType,
      });
    }
  }

  if (politicians.size > 0) {
    await db
      .insert(politiciansTable)
      .values([...politicians.values()])
      .onConflictDoUpdate({
        target: politiciansTable.id,
        set: {
          chamber: excluded(politiciansTable.chamber),
          firstName: excluded(politiciansTable.firstName),
          lastName: excluded(politiciansTable.lastName),
          party: excluded(politiciansTable.party),
        },
      });
  }

  if (issuers.size > 0) {
    await db
      .insert(issuerTable)
      .values([...issuers.values()])
      .onConflictDoUpdate({
        target: issuerTable.issuerId,
        set: {
          country: excluded(issuerTable.country),
          ticker: excluded(issuerTable.ticker),
          issuerName: excluded(issuerTable.issuerName),
          sector: excluded(issuerTable.sector),
        },
      });
  }

  if (trades.size > 0) {
    await db
      .insert(tradesTable)
      .values([...trades.values()])
      .onConflictDoNothing({
        target: tradesTable.tradeId,
      });
  }

  return {
    politicians: politicians.size,
    issuers: issuers.size,
    trades: trades.size,
  };
}

async function runScrapeJob() {
  const politician = process.env.POLITICIAN_FILTER;
  const pages = readPositiveNumber(process.env.SCRAPER_PAGES, 1);
  const result = await fetchPoliticianTrades({
    politician,
    pages,
  });
  const inserted = await insertPoliticianTrades(result);

  console.log(
    JSON.stringify(
      {
        finishedAt: new Date().toISOString(),
        politicianFilter: politician ?? null,
        pagesFetched: result.meta.pagesFetched,
        ...inserted,
      },
      null,
      2,
    ),
  );
}

function startScrapeCron() {
  const intervalMinutes = readPositiveNumber(
    process.env.SCRAPER_INTERVAL_MINUTES,
    DEFAULT_SCRAPE_INTERVAL_MINUTES,
  );
  const intervalMs = intervalMinutes * 60 * 1000;
  let isRunning = false;

  const run = async () => {
    if (isRunning) {
      console.warn("[scraper] skipped because previous job is still running");
      return;
    }

    isRunning = true;

    try {
      await runScrapeJob();
    } catch (error) {
      console.error("[scraper] failed", error);
    } finally {
      isRunning = false;
    }
  };

  void run();
  setInterval(() => {
    void run();
  }, intervalMs);
}

app.get("/", async (c) => {
  return c.text("Hello Hono!");
});

app.get("/trades", async (c) => {
  const politician = c.req.query("politician");
  const pages = Number(c.req.query("pages") ?? 1);
  const result: FetchPoliticianTradesResult = await fetchPoliticianTrades({
    politician,
    pages: Number.isFinite(pages) ? pages : 1,
  });

  return c.json(result);
});

if (import.meta.main) {
  startScrapeCron();
}

export default app;
