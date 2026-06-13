import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent } from "@corral/ui/components/card";
import { RadioGroup, RadioGroupItem } from "@corral/ui/components/radio-group";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";

import { useStickyCta } from "../components/sticky-cta";
import {
  fetchPublicEvent,
  getDemoPublicEventOrThrow,
  type PublicDisplayCategory,
  publicEventPath,
} from "../lib/public-events";
import { useRegistrationFlow } from "../mocks/store";
import { formatINR } from "../mocks/utils";
import { getDemo, RegisterScreen, validateRegisterSearch } from "./-register-components";

export const Route = createFileRoute("/events/$organizerSlug/$eventSlug/register/category")({
  validateSearch: validateRegisterSearch,
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps, params }) =>
    deps.demo
      ? getDemoPublicEventOrThrow(params.eventSlug)
      : fetchPublicEvent(params.organizerSlug, params.eventSlug),
  component: CategoryRoute,
});

function CategoryRoute() {
  const event = Route.useLoaderData();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const selectedCategory =
    event.categories.find((category) => category.id === flow.selectedCategoryId) ??
    event.categories[0];
  const selectedId = selectedCategory?.id;
  const canSelect = Boolean(selectedCategory && selectedCategory.status !== "sold-out");
  const cta = useMemo(
    () => (
      <div className="space-y-2" aria-live="polite">
        <Button
          disabled
          className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
        >
          Registration submission starts in MVP-04
        </Button>
        <p className="text-center text-muted-foreground text-xs">
          You can validate live category and fee display now; runner details and checkout are
          deferred.
        </p>
      </div>
    ),
    [],
  );

  useStickyCta(cta);

  return (
    <RegisterScreen
      eyebrow="P-06 · Category"
      title="Pick your race line."
      description="Choose the distance first. This page is live; saving the registration draft starts in the next MVP slice."
      demo={demo}
      demoUrls={[
        `${publicEventPath(event, "/register/category")}?demo=default`,
        `${publicEventPath(event, "/register/category")}?demo=loading`,
        `${publicEventPath(event, "/register/category")}?demo=offline`,
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
                      {category.minAge == null
                        ? "Age rules set by organizer"
                        : `Minimum age ${category.minAge}+`}
                    </span>
                  </span>
                  <span className="font-display text-2xl font-black text-brand-navy">
                    {tier ? formatINR(tier.amount) : "TBD"}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-orange-50 text-brand-orange-strong">
                    {tier?.label ?? "Fee pending"}
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
          {canSelect
            ? "Live category selection is ready. The continue action is intentionally disabled until registration persistence ships."
            : "Choose an available category once the organizer opens registration."}
        </CardContent>
      </Card>
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <a href={publicEventPath(event)}>Back to event landing</a>
      </Button>
    </RegisterScreen>
  );
}

function activeTier(category: PublicDisplayCategory) {
  return category.feeTiers.find((tier) => tier.active) ?? category.feeTiers[0];
}

function capacityLabel(category: PublicDisplayCategory) {
  const remaining = Math.max(category.capacity - category.registeredCount, 0);

  if (category.status === "sold-out") {
    return "Sold out";
  }

  if (remaining <= 25) {
    return `${remaining} spots left`;
  }

  return `${remaining.toLocaleString("en-IN")} spots open`;
}
