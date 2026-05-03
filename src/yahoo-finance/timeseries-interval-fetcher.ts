export type YahooFinanceTradingPeriod = {
  timezone: string;
  end: number;
  start: number;
  gmtoffset: number;
};

export type YahooFinanceChartMeta = {
  currency: string;
  symbol: string;
  exchangeName: string;
  fullExchangeName: string;
  instrumentType: string;
  firstTradeDate: number;
  regularMarketTime: number;
  hasPrePostMarketData: boolean;
  gmtoffset: number;
  timezone: string;
  exchangeTimezoneName: string;
  regularMarketPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  longName: string;
  shortName: string;
  chartPreviousClose: number;
  priceHint: number;
  currentTradingPeriod: {
    pre: YahooFinanceTradingPeriod;
    regular: YahooFinanceTradingPeriod;
    post: YahooFinanceTradingPeriod;
  };
  dataGranularity: string;
  range: string;
  validRanges: string[];
};

export type YahooFinanceQuote = {
  close: number[];
  volume: number[];
  high: number[];
  low: number[];
  open: number[];
};

export type YahooFinanceAdjustedClose = {
  adjclose: number[];
};

export type YahooFinanceChartResult = {
  meta: YahooFinanceChartMeta;
  timestamp: number[];
  indicators: {
    quote: YahooFinanceQuote[];
    adjclose: YahooFinanceAdjustedClose[];
  };
};

export type YahooFinanceChartError = {
  code: string;
  description: string;
};

export type YahooFinanceTimeseriesType = {
  chart: {
    result: YahooFinanceChartResult[] | null;
    error: YahooFinanceChartError | null;
  };
};

export async function FetchStock(
  ticker: string,
  range: string,
  interval: string,
): Promise<YahooFinanceTimeseriesType | undefined> {
  const baseUrl = "https://query1.finance.yahoo.com/v8/finance/chart/";

  try {
    const url = `${baseUrl}${ticker}?range=${range}&interval=${interval}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }

    const data = (await response.json()) as YahooFinanceTimeseriesType;
    return data;
  } catch (error) {
    throw error;
  }
}
