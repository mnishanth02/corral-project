import { createFileRoute } from "@tanstack/react-router";

import { BrandingScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup/branding")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Branding" },
  component: () => <BrandingScreen eventId={(Route.useParams() as { eventId: string }).eventId} />,
});
