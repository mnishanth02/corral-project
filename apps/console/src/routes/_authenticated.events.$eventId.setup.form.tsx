import { createFileRoute } from "@tanstack/react-router";

import { FormBuilderScreen, validateConsoleSearch } from "./-event-setup-screens";

export const Route = createFileRoute("/_authenticated/events/$eventId/setup/form")({
  validateSearch: validateConsoleSearch,
  staticData: { breadcrumb: "Form" },
  component: () => (
    <FormBuilderScreen eventId={(Route.useParams() as { eventId: string }).eventId} />
  ),
});
