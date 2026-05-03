To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

Fetch grouped trades:
```sh
bun run scrape
```

The `/trades` endpoint returns politicians with their trades nested under each politician:
```sh
curl 'http://localhost:3000/trades?politician=warner&pages=2'
```

Run the scraper on a schedule:
```sh
bun run cron
```

Optional scheduler settings:
```sh
POLITICIAN_FILTER=warner SCRAPER_PAGES=2 SCRAPER_INTERVAL_MINUTES=30 bun run cron
```

# Yahoo finance urls:
`https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=1mo&interval=1d`

With this we can get a stocks 1 mounth priceses with 1 day intervals

For exampel with this you can get 1 year with 1 day intervals: `"https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1y&interval=1d";`

> General format is: `/v8/finance/chart/{symbol}?range={range}&interval={interval}`

## Some of the usefull range and intervals:
``` 
range:
  - 1d
  - 5d
  - 1mo
  - 3mo
  - 6mo
  - 1y
  - 2y
  - 5y
  - 10y
  - ytd
  - max
```

``` 
interval:
  - 1m
  - 2m
  - 5m
  - 15m
  - 30m
  - 60m
  - 90m
  - 1h
  - 1d
  - 5d
  - 1wk
  - 1mo
  - 3mo
```

> Note:
> For Borsa İstanbul, you usually use `.IS`

## How toget between 2 dates: 
Yahoo wants:
```
period1 = start date as Unix timestamp in seconds
period2 = end date as Unix timestamp in seconds
interval = 1d / 1wk / 1mo / etc.
```

> The URL is: 
> `https://query1.finance.yahoo.com/v8/finance/chart/AAPL?period1=START&period2=END&interval=1d`
