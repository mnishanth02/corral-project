import { createFileRoute } from "@tanstack/react-router";

import { IndexPage } from "./-page";

export const Route = createFileRoute("/_authenticated/")({
  component: IndexPage,
});
