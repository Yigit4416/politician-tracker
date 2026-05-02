export type CapitolPolitician = {
  _stateId: string | null;
  chamber: string | null;
  dob: string | null;
  firstName: string;
  gender: string | null;
  lastName: string;
  nickname: string | null;
  party: string | null;
};

export type CapitolIssuer = {
  _stateId: string | null;
  c2iq: string | null;
  country: string | null;
  issuerName: string;
  issuerTicker: string | null;
  sector: string | null;
};

export type CapitolTrade = {
  _issuerId: number;
  _politicianId: string;
  _txId: number;
  chamber: string | null;
  comment: string | null;
  issuer: CapitolIssuer;
  owner: string | null;
  politician: CapitolPolitician;
  price: number | null;
  pubDate: string;
  reportingGap: number | null;
  txDate: string;
  txType: string;
  txTypeExtended: string | null;
  value: number | null;
};

export type PoliticianTrades = {
  id: string;
  fullName: string;
  politician: CapitolPolitician;
  trades: CapitolTrade[];
};

export type CapitolTradePaging = {
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
};

export type CapitolTradeResponse = {
  data: CapitolTrade[];
  meta?: {
    paging?: CapitolTradePaging;
  };
};

export type FetchPoliticianTradesOptions = {
  politician?: string;
  pages?: number;
};

export type FetchPoliticianTradesResult = {
  politicians: PoliticianTrades[];
  meta: {
    pagesFetched: number;
    paging?: CapitolTradePaging;
  };
};

const BASE_URL = "https://www.capitoltrades.com/trades";

function parseTradesPage(html: string, page: number): CapitolTradeResponse {
  const decoded = html.replace(/\\"/g, '"');
  const dataMarker = '"data":[';
  const dataStart = decoded.indexOf(dataMarker);

  if (dataStart === -1) {
    throw new Error("Capitol Trades response did not include trade data");
  }

  const dataEnd = decoded.indexOf('],"columnVisibility"', dataStart);

  if (dataEnd === -1) {
    throw new Error("Capitol Trades response had an unexpected data shape");
  }

  const data = JSON.parse(
    `[${decoded.slice(dataStart + dataMarker.length, dataEnd)}]`,
  ) as CapitolTrade[];
  const metaSource = decoded.slice(dataEnd, dataEnd + 400);
  const totalPages = Number(metaSource.match(/"totalPages":(\d+)/)?.[1] ?? 0);
  const totalItems = Number(metaSource.match(/"totalCount":(\d+)/)?.[1] ?? 0);

  return {
    data,
    meta: {
      paging: {
        page,
        size: data.length,
        totalPages,
        totalItems,
      },
    },
  };
}

function getPoliticianFullName(politician: CapitolPolitician) {
  return [politician.firstName, politician.lastName].filter(Boolean).join(" ");
}

function matchesPolitician(trade: CapitolTrade, politicianFilter?: string) {
  if (!politicianFilter) {
    return true;
  }

  const filter = politicianFilter.toLowerCase();
  const fullName = getPoliticianFullName(trade.politician).toLowerCase();

  return (
    trade._politicianId.toLowerCase() === filter ||
    fullName.includes(filter) ||
    trade.politician.lastName.toLowerCase() === filter
  );
}

export function groupTradesByPolitician(
  trades: CapitolTrade[],
  politicianFilter?: string,
) {
  const politicians = new Map<string, PoliticianTrades>();

  for (const trade of trades) {
    if (!matchesPolitician(trade, politicianFilter)) {
      continue;
    }

    const existing = politicians.get(trade._politicianId);

    if (existing) {
      existing.trades.push(trade);
      continue;
    }

    politicians.set(trade._politicianId, {
      id: trade._politicianId,
      fullName: getPoliticianFullName(trade.politician),
      politician: trade.politician,
      trades: [trade],
    });
  }

  return [...politicians.values()];
}

export async function fetchTradesPage(page = 1) {
  const url = new URL(BASE_URL);

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  const res = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      referer: "https://www.capitoltrades.com/",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Capitol Trades request failed: ${res.status}`);
  }

  return parseTradesPage(await res.text(), page);
}

export async function fetchPoliticianTrades(
  options: FetchPoliticianTradesOptions = {},
): Promise<FetchPoliticianTradesResult> {
  const pages = Math.max(1, options.pages ?? 1);
  const allTrades: CapitolTrade[] = [];
  let pagesFetched = 0;
  let lastPaging: CapitolTradePaging | undefined;

  for (let page = 1; page <= pages; page += 1) {
    const response = await fetchTradesPage(page);

    allTrades.push(...response.data);
    pagesFetched += 1;
    lastPaging = response.meta?.paging;

    if (lastPaging?.totalPages && page >= lastPaging.totalPages) {
      break;
    }
  }

  return {
    politicians: groupTradesByPolitician(allTrades, options.politician),
    meta: {
      pagesFetched,
      paging: lastPaging,
    },
  };
}

async function fetchLatestTrades() {
  const result = await fetchPoliticianTrades();

  console.log(JSON.stringify(result, null, 2));

  return result;
}

if (import.meta.main) {
  fetchLatestTrades().catch(console.error);
}
