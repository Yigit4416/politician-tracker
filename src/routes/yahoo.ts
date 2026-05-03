import { Hono } from "hono";
import { FetchStock } from "../yahoo-finance/timeseries-interval-fetcher";

const yahooRouter = new Hono().get("/:ticker/:range/:interval", async (c) => {
  try {
    const ticker = c.req.param("ticker");
    const range = c.req.param("range");
    const interval = c.req.param("interval");
    const data = await FetchStock(ticker, range, interval);

    if (data === undefined) {
      return c.json({ error: "Data not found" });
    }

    const closeData = data.chart.result?.[0].indicators.quote[0].close;

    return c.json(closeData);
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default yahooRouter;
