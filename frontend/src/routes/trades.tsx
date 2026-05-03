import { createFileRoute } from "@tanstack/react-router";

import { TradesPage } from "@/pages/TradesPage";

export const Route = createFileRoute("/trades")({
  component: TradesPage,
});
