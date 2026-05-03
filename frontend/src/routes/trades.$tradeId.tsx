import { createFileRoute } from "@tanstack/react-router";

import { TradeDetailPage } from "@/pages/TradeDetailPage";

export const Route = createFileRoute("/trades/$tradeId")({
  component: TradeDetailPage,
});
