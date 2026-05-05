import { AllTrades } from "@/pages/AllTrades";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/all-trades")({
  validateSearch: (search: Record<string, unknown>) => ({
    politician:
      typeof search.politician === "string" ? search.politician : undefined,
  }),
  component: AllTrades,
});
