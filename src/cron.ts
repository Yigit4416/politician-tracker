import { fetchPoliticianTrades } from "./scraper";

const DEFAULT_INTERVAL_MINUTES = 24 * 60;

function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function runScrapeJob() {
  const politician = process.env.POLITICIAN_FILTER;
  const pages = readPositiveNumber(process.env.SCRAPER_PAGES, 1);
  const startedAt = new Date();

  console.log(`[scraper] started ${startedAt.toISOString()}`);

  const result = await fetchPoliticianTrades({
    politician,
    pages,
  });

  const tradeCount = result.politicians.reduce(
    (total, politician) => total + politician.trades.length,
    0,
  );

  console.log(
    JSON.stringify(
      {
        finishedAt: new Date().toISOString(),
        politicianFilter: politician ?? null,
        politicians: result.politicians.length,
        trades: tradeCount,
        paging: result.meta.paging,
      },
      null,
      2,
    ),
  );
}

async function runForever() {
  const intervalMinutes = readPositiveNumber(
    process.env.SCRAPER_INTERVAL_MINUTES,
    DEFAULT_INTERVAL_MINUTES,
  );
  const intervalMs = intervalMinutes * 60 * 1000;

  await runScrapeJob().catch((error) => {
    console.error("[scraper] failed", error);
  });

  setInterval(() => {
    runScrapeJob().catch((error) => {
      console.error("[scraper] failed", error);
    });
  }, intervalMs);
}

if (import.meta.main) {
  runForever();
}
