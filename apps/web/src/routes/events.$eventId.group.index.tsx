import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { Checkbox } from "@corral/ui/components/checkbox";
import { EmptyState } from "@corral/ui/components/empty-state";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { Separator } from "@corral/ui/components/separator";
import { FormSkeleton, ListSkeleton } from "@corral/ui/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@corral/ui/components/tabs";
import { Textarea } from "@corral/ui/components/textarea";
import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import type { DemoState } from "../mocks/types";
import { formatINR, mockMutate } from "../mocks/utils";
import {
  calculateTotals,
  currentDemo,
  draftForDemo,
  emptyRunner,
  type RunnerDraft,
  rowFee,
  statusLabel,
  teeSizeOptions,
  validateGroupSearch,
} from "./-group-registration-data";

export const Route = createFileRoute("/events/$eventId/group/")({
  validateSearch: validateGroupSearch,
  component: GroupEntryScreen,
});

const csvSample =
  "Name,Mobile,Email,Gender,DOB,Distance,T-shirt\nPriya Raman,9876510420,priya@example.test,Female,1994-08-16,10K,M";

function GroupEntryScreen() {
  const { eventId } = useParams({ from: "/events/$eventId/group/" });
  const search = useSearch({ from: "/events/$eventId/group/" });
  const demo = currentDemo(search);
  const seededDraft = useMemo(() => draftForDemo(demo), [demo]);
  const [runners, setRunners] = useState(seededDraft.runners);
  const [attested, setAttested] = useState(seededDraft.attested);
  const [parseMessage, setParseMessage] = useState<string | undefined>();
  const flow = useRegistrationFlow();

  useEffect(() => {
    setRunners(seededDraft.runners);
    setAttested(seededDraft.attested);
    setParseMessage(undefined);
  }, [seededDraft]);

  const totals = calculateTotals({ ...seededDraft, runners, attested });
  const blockingIssues =
    runners.filter((runner) => runner.status === "error").length + (attested ? 0 : 1);
  const canContinue = runners.length > 0 && blockingIssues === 0;

  async function parseCsv() {
    const result = await mockMutate({ rows: runners.length }, { demo });
    setParseMessage(
      result.status === "validation-error"
        ? "Parsed 8 runners, 1 row needs attention. Duplicate mobiles are highlighted below."
        : "Parsed 8 runners from CSV. Review row warnings before continuing.",
    );
  }

  const cta = useMemo(
    () => (
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand-navy">{totals.label}</span>
          <span className={canContinue ? "text-success-text" : "text-danger-text"}>
            {canContinue
              ? "Ready for roster"
              : `Fix ${blockingIssues} item${blockingIssues === 1 ? "" : "s"}`}
          </span>
        </div>
        <Button
          asChild
          disabled={!canContinue}
          className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/20"
        >
          <Link
            to="/events/$eventId/group/roster"
            params={{ eventId }}
            search={{ demo: demo === "default" ? undefined : demo }}
          >
            Review roster
          </Link>
        </Button>
      </div>
    ),
    [blockingIssues, canContinue, demo, eventId, totals.label],
  );

  useStickyCta(cta);

  if (demo === "loading") {
    return <LoadingEntry />;
  }

  if (demo === "empty") {
    return (
      <EmptyState
        title="Start your team list"
        description="Add rows one by one or paste a CSV exported from your club sheet. Nothing leaves this browser."
        action={
          <Button asChild>
            <Link to="/events/$eventId/group" params={{ eventId }} search={{ demo: undefined }}>
              Add first runner
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5" id="billing">
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
            Coordinator & invoice details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="coordinator-name">Coordinator name</FieldLabel>
              <Input
                id="coordinator-name"
                defaultValue={seededDraft.coordinator.name}
                autoComplete="name"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="coordinator-mobile">Mobile</FieldLabel>
                <Input
                  id="coordinator-mobile"
                  defaultValue={seededDraft.coordinator.mobile}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="coordinator-email">Email</FieldLabel>
                <Input
                  id="coordinator-email"
                  defaultValue={seededDraft.coordinator.email}
                  type="email"
                  autoComplete="email"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="organisation">Organisation / club</FieldLabel>
              <Input id="organisation" defaultValue={seededDraft.coordinator.organisation} />
            </Field>
            <div className="rounded-2xl border border-info/30 bg-info/10 p-4">
              <div className="flex min-h-11 items-start gap-3 text-sm font-medium">
                <Checkbox
                  id="gst-registered"
                  defaultChecked={seededDraft.billing.gstRegistered}
                  aria-label="GST registered organisation"
                />
                <label htmlFor="gst-registered">
                  GST registered organisation — generate one tax invoice for the coordinator.
                </label>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={demo === "validation-error"}>
                  <FieldLabel htmlFor="gstin">GSTIN</FieldLabel>
                  <Input
                    id="gstin"
                    defaultValue={seededDraft.billing.gstin}
                    aria-invalid={demo === "validation-error"}
                  />
                  {demo === "validation-error" ? (
                    <FieldError>Enter a valid 15-character GSTIN.</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="place">Place of supply</FieldLabel>
                  <Input id="place" defaultValue={seededDraft.billing.state} />
                </Field>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-orange-100 shadow-lg shadow-slate-950/5">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-display text-2xl tracking-[-0.04em] text-brand-navy">
              Add your team
            </CardTitle>
            <Badge variant={demo === "success" ? "success" : "warning"}>
              {runners.length} runners
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="rows">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="rows" className="rounded-xl">
                Add rows
              </TabsTrigger>
              <TabsTrigger value="csv" className="rounded-xl">
                Paste CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="rows" className="mt-4 space-y-3">
              {runners.map((runner, index) => (
                <RunnerCard
                  key={runner.id}
                  runner={runner}
                  index={index}
                  demo={demo}
                  onChange={(next) =>
                    setRunners((items) =>
                      items.map((item) => (item.id === runner.id ? next : item)),
                    )
                  }
                />
              ))}
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full rounded-2xl"
                onClick={() =>
                  setRunners((items) => [
                    ...items,
                    { ...emptyRunner, id: `runner-new-${items.length + 1}` },
                  ])
                }
              >
                Add runner
              </Button>
            </TabsContent>
            <TabsContent value="csv" className="mt-4 space-y-3">
              <Field>
                <FieldLabel htmlFor="csv-paste">Paste CSV rows</FieldLabel>
                <Textarea
                  id="csv-paste"
                  defaultValue={csvSample}
                  rows={6}
                  className="min-h-36 rounded-2xl font-mono text-xs"
                />
                <FieldDescription>
                  Paste columns: Name, Mobile, Email, Gender, DOB, Distance, T-shirt. First row =
                  headers.
                </FieldDescription>
              </Field>
              <Button type="button" className="min-h-11 rounded-2xl" onClick={parseCsv}>
                Parse CSV
              </Button>
              {parseMessage ? (
                <Alert className="border-info/30 bg-info/10">
                  <AlertTitle>CSV parsed</AlertTitle>
                  <AlertDescription>{parseMessage}</AlertDescription>
                </Alert>
              ) : null}
            </TabsContent>
          </Tabs>

          <Separator />
          <div className="flex min-h-11 items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-sm font-medium">
            <Checkbox
              id="group-authority-attestation"
              checked={attested}
              onCheckedChange={(checked) => setAttested(checked === true)}
              aria-label="I am authorised to register these runners"
            />
            <label htmlFor="group-authority-attestation">
              I'm registering these runners with their consent and I'm authorised to share their
              details.
            </label>
          </div>
          {!attested ? (
            <p className="text-sm text-danger-text" aria-live="polite">
              Authority attestation is required before roster review.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-orange-100">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Flow seed</span>
            <span className="font-bold text-brand-navy">{flow.selectedCategoryId}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Running total</span>
            <span className="font-display text-2xl font-black text-brand-navy">
              {formatINR(totals.total)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RunnerCard({
  runner,
  index,
  demo,
  onChange,
}: {
  runner: RunnerDraft;
  index: number;
  demo: DemoState;
  onChange: (runner: RunnerDraft) => void;
}) {
  const hasError = runner.status === "error";
  const badgeVariant =
    runner.status === "valid" ? "success" : runner.status === "warning" ? "warning" : "destructive";

  return (
    <article
      className={`rounded-[1.5rem] border p-4 ${hasError ? "border-danger/40 bg-danger/5" : "border-orange-100 bg-white"}`}
      aria-labelledby={`${runner.id}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`${runner.id}-title`} className="font-bold text-brand-navy">
            Runner {index + 1}
          </h3>
          <p className="text-xs text-muted-foreground">
            {runner.distance} · Tee {runner.tshirtSize} · {formatINR(runner.fee)}
          </p>
        </div>
        <Badge variant={badgeVariant}>{statusLabel(runner.status)}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <Field data-invalid={hasError && !runner.name}>
          <FieldLabel htmlFor={`${runner.id}-name`}>Runner {index + 1} name</FieldLabel>
          <Input id={`${runner.id}-name`} defaultValue={runner.name} placeholder="Full name" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field data-invalid={hasError}>
            <FieldLabel htmlFor={`${runner.id}-mobile`}>Runner {index + 1} mobile</FieldLabel>
            <Input
              id={`${runner.id}-mobile`}
              defaultValue={runner.mobile}
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={hasError}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${runner.id}-email`}>Runner {index + 1} email</FieldLabel>
            <Input id={`${runner.id}-email`} defaultValue={runner.email} type="email" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={`${runner.id}-distance`}>Runner {index + 1} distance</FieldLabel>
            <select
              id={`${runner.id}-distance`}
              defaultValue={runner.distance}
              className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm"
              onChange={(event) =>
                onChange({
                  ...runner,
                  distance: event.target.value as RunnerDraft["distance"],
                  fee: rowFee(event.target.value as RunnerDraft["distance"]),
                })
              }
            >
              <option>5K</option>
              <option>10K</option>
              <option>21K</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${runner.id}-tee`}>Runner {index + 1} T-shirt</FieldLabel>
            <select
              id={`${runner.id}-tee`}
              defaultValue={runner.tshirtSize}
              className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {teeSizeOptions().map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
      {runner.issues.length > 0 || demo === "validation-error" ? (
        <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm" aria-live="polite">
          {(runner.issues.length
            ? runner.issues
            : ["Select a distance and enter a valid 10-digit mobile."]
          ).map((issue) => (
            <p key={issue} className={hasError ? "text-danger-text" : "text-warning-text"}>
              ● {issue}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function LoadingEntry() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading group entry">
      <FormSkeleton className="rounded-[2rem] border bg-white p-5" />
      <ListSkeleton />
    </div>
  );
}
