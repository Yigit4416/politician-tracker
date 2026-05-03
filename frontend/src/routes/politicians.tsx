import { createFileRoute } from "@tanstack/react-router";
import { PoliticiansPage } from "../pages/PoliticiansPage";

export const Route = createFileRoute("/politicians")({
  component: PoliticiansPage,
});
