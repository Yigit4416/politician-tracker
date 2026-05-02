import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const politiciansTable = pgTable("politicians", {
  id: text().primaryKey(),
  chamber: text().notNull(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  party: varchar({ length: 255 }).notNull(),
});

export const tradesTable = pgTable(
  "trades",
  {
    tradeId: bigint({ mode: "number" }).primaryKey(),
    traderId: text()
      .notNull()
      .references(() => politiciansTable.id),
    issuerId: text()
      .notNull()
      .references(() => issuerTable.issuerId),
    publishingDate: timestamp().notNull(),
    tradeDate: timestamp().notNull(),
    reportingGap: integer().notNull(),
    type: text().notNull(),
  },
  (table) => {
    return {
      traderIdIndex: index("trader_id_index").on(table.traderId), // This is for index
    };
  },
);

export const issuerTable = pgTable("issuer", {
  issuerId: text().primaryKey(),
  country: text().notNull(),
  ticker: text().notNull(),
  issuerName: text().notNull(),
  sector: text(),
});
