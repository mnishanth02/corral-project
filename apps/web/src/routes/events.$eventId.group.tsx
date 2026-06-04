import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";

import { RegistrationFlowProvider } from "../mocks/store";
import { validateGroupSearch } from "./-group-registration-data";

export const Route = createFileRoute("/events/$eventId/group")({
  validateSearch: validateGroupSearch,
  component: GroupRegistrationShell,
});

const steps = [
  { id: "entry", label: "Entry", to: "/events/$eventId/group" },
  { id: "roster", label: "Roster", to: "/events/$eventId/group/roster" },
  { id: "payment", label: "Payment", to: "/events/$eventId/group/payment" },
] as const;

function GroupRegistrationShell() {
  const { eventId } = useParams({ from: "/events/$eventId/group" });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeIndex = pathname.endsWith("/payment") ? 2 : pathname.endsWith("/roster") ? 1 : 0;

  return (
    <RegistrationFlowProvider persist={false}>
      <section className="space-y-4 py-2">
        <div className="rounded-[2rem] border border-orange-100 bg-white p-4 shadow-lg shadow-slate-950/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="info" className="rounded-full">
                Group registration
              </Badge>
              <h1 className="mt-3 font-display text-3xl font-black leading-none tracking-[-0.05em] text-brand-navy">
                Team checkout
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Add runners, validate the roster, and pay once for a single GST invoice.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 rounded-2xl px-3">
              <Link to="..">Back</Link>
            </Button>
          </div>
          <nav aria-label="Group registration steps" className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((step, index) => (
              <Link
                key={step.id}
                to={step.to}
                params={{ eventId }}
                className={`min-h-11 rounded-2xl border px-2 py-2 text-center text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === activeIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < activeIndex
                      ? "border-success/30 bg-success/10 text-success-text"
                      : "border-orange-100 bg-secondary text-muted-foreground"
                }`}
              >
                <span className="block text-[0.65rem] uppercase tracking-[0.18em]">
                  Step {index + 1}
                </span>
                {step.label}
              </Link>
            ))}
          </nav>
        </div>
        <Outlet />
      </section>
    </RegistrationFlowProvider>
  );
}
