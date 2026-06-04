import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR } from "../mocks/utils";
import {
  activeTier,
  capacityLabel,
  findEvent,
  getDemo,
  RegisterScreen,
  validateRegisterSearch,
} from "./-register-components";

export const Route = createFileRoute("/events/$eventId/register/category")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: CategoryRoute,
});

function CategoryRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const selectedId = flow.selectedCategoryId ?? event.categories[0]?.id;
  const selectedCategory = event.categories.find((category) => category.id === selectedId);
  const canContinue = Boolean(selectedCategory && selectedCategory.status !== "sold-out");
  const cta = useMemo(
    () => (
      <Button
        asChild={canContinue}
        disabled={!canContinue}
        className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
      >
        {canContinue ? (
          <Link to="/events/$eventId/register/form" params={{ eventId }}>
            Continue to runner details
          </Link>
        ) : (
          "Choose an available category"
        )}
      </Button>
    ),
    [canContinue, eventId],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-06 · Category"
      title="Pick your race line."
      description="Choose the distance first; the active fee tier is locked into the frontend checkout draft."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/category?demo=default`,
        `/events/${event.id}/register/category?demo=loading`,
        `/events/${event.id}/register/category?demo=offline`,
      ]}
    >
      <RadioGroup
        value={selectedId}
        onValueChange={(value) => flow.setSelectedCategory(value)}
        aria-label="Select race category"
      >
        {event.categories.map((category) => {
          const tier = activeTier(category);
          const soldOut = category.status === "sold-out";
          const selected = selectedId === category.id;

          return (
            <label
              key={category.id}
              htmlFor={`category-${category.id}`}
              className={`flex min-h-28 cursor-pointer gap-3 rounded-[1.5rem] border bg-white p-4 shadow-sm transition-[border-color,box-shadow] ${
                selected ? "border-primary shadow-orange-500/20" : "border-border"
              } ${soldOut ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <RadioGroupItem
                id={`category-${category.id}`}
                value={category.id}
                disabled={soldOut}
                className="mt-1 size-5"
              />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-display text-2xl font-black tracking-[-0.04em] text-brand-navy">
                      {category.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Minimum age {category.minAge}+
                    </span>
                  </span>
                  <span className="font-display text-2xl font-black text-brand-navy">
                    {formatINR(tier.amount)}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-orange-50 text-brand-orange-strong">
                    {tier.label}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {capacityLabel(category)}
                  </Badge>
                </span>
                <span className="block text-xs leading-5 text-muted-foreground">
                  Includes {category.includes.join(", ")}.
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
      <Card className="rounded-[1.5rem] border-orange-100">
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          Early-bird prices are shown when the active tier applies. 21K is disabled in this fixture
          to make the sold-out state keyboard and screen-reader testable.
        </CardContent>
      </Card>
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <Link to="/">Back to event landing</Link>
      </Button>
    </RegisterScreen>
  );
}
