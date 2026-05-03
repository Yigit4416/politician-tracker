import { AllTrades } from "@/pages/AllTrades";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/all-trades")({
  component: AllTrades,
});
