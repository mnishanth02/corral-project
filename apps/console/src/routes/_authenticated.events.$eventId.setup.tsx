import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup")({
  beforeLoad: ({ location, params }) => {
    if (location.pathname === `/events/${params.eventId}/setup`) {
      throw redirect({ href: `/events/${params.eventId}/setup/basics` });
    }
  },
  staticData: { breadcrumb: "Setup" },
  component: () => <Outlet />,
});
