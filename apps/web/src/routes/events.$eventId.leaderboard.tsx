import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { EmptyState } from "@corral/ui/components/empty-state";
import { Input } from "@corral/ui/components/input";
import { Skeleton } from "@corral/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { leaderboardRows } from "../mocks/results";
import {
  BackLink,
  categoryName,
  getEvent,
  PageHeader,
  StatusPill,
  validateDemoSearch,
} from "./-my-area";

export const Route = createFileRoute("/events/$eventId/leaderboard")({
  validateSearch: validateDemoSearch,
  component: LeaderboardScreen,
});

function LeaderboardScreen() {
  const { eventId } = Route.useParams();
  const { demo = "default", q = "", view = "overall" } = Route.useSearch();
  const event = getEvent(eventId);
  if (!event) {
    throw notFound();
  }

  const filtered =
    demo === "empty"
      ? []
      : leaderboardRows.filter((row) =>
          `${row.participantName} ${row.bibNumber}`.toLowerCase().includes(q.toLowerCase()),
        );

  return (
    <section className="space-y-5 py-3">
      <BackLink to="/events/$eventId/race-day" params={{ eventId: event.slug }}>
        Race-day guide
      </BackLink>
      <PageHeader
        eyebrow="P-23 · Leaderboard"
        title="Live rankings"
        description="Tabbed overall, category and age-group views. Search runs locally against mock timing rows."
        action={<StatusPill status="ok" label="Published" />}
      />

      <Tabs value={view} className="gap-4">
        <TabsList className="grid min-h-11 w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="overall" asChild>
            <Link
              to="/events/$eventId/leaderboard"
              params={{ eventId: event.slug }}
              search={{ view: "overall", demo, q }}
            >
              Overall
            </Link>
          </TabsTrigger>
          <TabsTrigger value="category" asChild>
            <Link
              to="/events/$eventId/leaderboard"
              params={{ eventId: event.slug }}
              search={{ view: "category", demo, q }}
            >
              Category
            </Link>
          </TabsTrigger>
          <TabsTrigger value="age-group" asChild>
            <Link
              to="/events/$eventId/leaderboard"
              params={{ eventId: event.slug }}
              search={{ view: "age-group", demo, q }}
            >
              Age group
            </Link>
          </TabsTrigger>
        </TabsList>
        <Input
          className="min-h-12 rounded-2xl bg-white"
          placeholder="Search name or BIB"
          value={q}
          readOnly
          aria-label="Search leaderboard"
        />
        <TabsContent value={view} className="space-y-3">
          {demo === "loading" ? <LoadingRows /> : null}
          {demo !== "loading" && filtered.length === 0 ? (
            <EmptyState
              title="No leaderboard rows"
              description="Try a different name or switch tabs. Empty state is deterministic for ?demo=empty."
              className="rounded-[2rem] border-orange-100 bg-white"
            />
          ) : null}
          {demo !== "loading"
            ? filtered.map((row) => (
                <div
                  key={row.bibNumber}
                  className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-3xl border p-4 ${row.bibNumber === "1042" ? "border-orange-300 bg-orange-50" : "border-orange-100 bg-white"}`}
                >
                  <div className="font-display font-black text-2xl text-brand-navy">
                    #{row.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy">{row.participantName}</p>
                    <p className="text-xs text-muted-foreground">
                      BIB {row.bibNumber} · {categoryName(event, row.categoryId)} ·{" "}
                      {view === "age-group" ? "F30–34" : row.gender}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-navy">{row.finishTime}</p>
                    <Badge
                      variant={row.bibNumber === "1042" ? "warning" : "secondary"}
                      className="mt-1 rounded-full"
                    >
                      {row.bibNumber === "1042" ? "You" : row.pace}
                    </Badge>
                  </div>
                </div>
              ))
            : null}
        </TabsContent>
      </Tabs>
      <Button asChild variant="outline" className="min-h-11 w-full rounded-2xl bg-white">
        <Link
          to="/my/registrations/$registrationId/result"
          params={{ registrationId: "reg-ananya-10k-confirmed" }}
        >
          Back to my result
        </Link>
      </Button>
    </section>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-20 rounded-3xl" />
      ))}
    </div>
  );
}
