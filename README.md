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
