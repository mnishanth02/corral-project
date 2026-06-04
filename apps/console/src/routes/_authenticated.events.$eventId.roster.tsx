import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/events/$eventId/roster")({
  staticData: { breadcrumb: "Roster" },
  component: () => <Outlet />,
});
