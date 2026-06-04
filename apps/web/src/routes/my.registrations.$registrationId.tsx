import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Separator } from "@corral/ui/components/separator";
import { createFileRoute, Link, notFound, Outlet } from "@tanstack/react-router";

import { getRegistrationBundle, validateDemoSearch } from "./-my-area";

export const Route = createFileRoute("/my/registrations/$registrationId")({
  validateSearch: validateDemoSearch,
  beforeLoad: ({ params }) => {
    if (!getRegistrationBundle(params.registrationId)) {
      throw notFound();
    }
  },
  component: MyRegistrationShell,
});

function MyRegistrationShell() {
  const { registrationId } = Route.useParams();
  const bundle = getRegistrationBundle(registrationId);

  if (!bundle) {
    throw notFound();
  }

  return (
    <section className="space-y-4 py-3">
      <div className="rounded-[2rem] border border-orange-100 bg-white/90 p-4 shadow-lg shadow-slate-950/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-[0.68rem] uppercase tracking-[0.24em] text-brand-orange-strong">
              My area
            </p>
            <p className="mt-1 font-display font-black text-2xl tracking-[-0.05em] text-brand-navy">
              {bundle.registration.participantName}
            </p>
          </div>
          <Badge variant="info" className="rounded-full">
            {bundle.category.name}
          </Badge>
        </div>
        <Separator className="my-4" />
        <nav aria-label="My registration sections" className="grid grid-cols-2 gap-2 text-sm">
          <Button asChild variant="ghost" className="min-h-11 rounded-2xl justify-start">
            <Link to="/my/registrations/$registrationId" params={{ registrationId }}>
              Ticket
            </Link>
          </Button>
          <Button asChild variant="ghost" className="min-h-11 rounded-2xl justify-start">
            <Link to="/my/registrations/$registrationId/kit" params={{ registrationId }}>
              Kit
            </Link>
          </Button>
          <Button asChild variant="ghost" className="min-h-11 rounded-2xl justify-start">
            <Link to="/my/registrations/$registrationId/result" params={{ registrationId }}>
              Result
            </Link>
          </Button>
          <Button asChild variant="ghost" className="min-h-11 rounded-2xl justify-start">
            <Link to="/my/registrations/$registrationId/insurance" params={{ registrationId }}>
              Insurance
            </Link>
          </Button>
        </nav>
      </div>
      <Outlet />
    </section>
  );
}
