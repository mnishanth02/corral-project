import { createFileRoute, redirect } from "@tanstack/react-router";

import { findEvent, validateRegisterSearch, WizardLayout } from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register")({
  validateSearch: validateRegisterSearch,
  beforeLoad: ({ params, location }) => {
    if (location.pathname.replace(/\/$/, "").endsWith("/register")) {
      throw redirect({
        to: "/events/$eventId/register/category",
        params: { eventId: params.eventId },
      });
    }
  },
  loader: ({ params }) => findEvent(params.eventId),
  component: RegisterLayoutRoute,
});

function RegisterLayoutRoute() {
  const event = Route.useLoaderData();

  return <WizardLayout event={event} />;
}
