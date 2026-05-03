import { Outlet, createFileRoute } from "@tanstack/react-router";

function TradesLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/trades")({
  component: TradesLayout,
});
