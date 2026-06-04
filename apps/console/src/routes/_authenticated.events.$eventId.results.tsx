import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/events/$eventId/results")({
  beforeLoad: ({ location, params }) => {
    if (location.pathname === `/events/${params.eventId}/results`) {
      throw redirect({ href: `/events/${params.eventId}/results/upload` });
    }
  },
  staticData: { breadcrumb: "Results" },
  component: () => <Outlet />,
});
