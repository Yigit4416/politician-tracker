import { TradesPage } from "@/pages/TradesPage";
import { useSearch } from "@tanstack/react-router";

export function AllTrades() {
  const { politician } = useSearch({ from: "/all-trades" });

  return <TradesPage politicianId={politician} />;
}
