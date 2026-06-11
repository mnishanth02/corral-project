import type {
  AdminOrganizerDetailResponse,
  AdminReviewOrganizerRequest,
  OrganizerReviewStatus,
  OrganizerSummary,
} from "@corral/schema";
import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@corral/ui/components/field";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge, type StatusKind } from "@corral/ui/components/status-badge";
import { Textarea } from "@corral/ui/components/textarea";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { consoleApiClient } from "../lib/api";

const reviewFilters: Array<OrganizerReviewStatus | "all"> = [
  "pending",
  "changes-requested",
  "approved",
  "rejected",
  "suspended",
  "all",
];

const reviewActions: AdminReviewOrganizerRequest["reviewStatus"][] = [
  "approved",
  "changes-requested",
  "rejected",
  "suspended",
];

export const Route = createFileRoute("/admin/organizers")({
  staticData: { breadcrumb: "Organizers" },
  component: AdminOrganizersPage,
});

function AdminOrganizersPage() {
  const [filter, setFilter] = useState<OrganizerReviewStatus | "all">("pending");
  const [organizers, setOrganizers] = useState<OrganizerSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrganizerDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOrganizers(null);
    setDetail(null);
    setError(null);

    void loadOrganizers(filter)
      .then((nextOrganizers) => {
        if (cancelled) return;
        setOrganizers(nextOrganizers);
        setSelectedId(nextOrganizers[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load organizers.");
        setOrganizers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetail(null);

    void loadOrganizerDetail(selectedId)
      .then((nextDetail) => {
        if (!cancelled) setDetail(nextDetail);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load organizer.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const counts = useMemo(() => {
    const values = organizers ?? [];
    return {
      total: values.length,
      pending: values.filter((organizer) => organizer.reviewStatus === "pending").length,
      approved: values.filter((organizer) => organizer.reviewStatus === "approved").length,
      blocked: values.filter((organizer) =>
        ["changes-requested", "rejected", "suspended"].includes(organizer.reviewStatus),
      ).length,
    };
  }, [organizers]);

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detail) return;

    const form = new FormData(event.currentTarget);
    const reviewStatus = String(
      form.get("reviewStatus") ?? "",
    ) as AdminReviewOrganizerRequest["reviewStatus"];
    const reviewReason = String(form.get("reviewReason") ?? "").trim();

    if (!reviewActions.includes(reviewStatus)) {
      setError("Choose a review action.");
      return;
    }

    if (reviewStatus !== "approved" && !reviewReason) {
      setError("Add a review reason when requesting changes, rejecting, or suspending.");
      return;
    }

    setIsReviewing(true);
    setError(null);
    setNotice(null);

    const response = await consoleApiClient.adminReviewOrganizer({
      headers: {},
      params: { organizerId: detail.organizer.id },
      body: { reviewStatus, reviewReason: reviewReason || undefined },
    });

    setIsReviewing(false);

    if (response.status !== 200) {
      setError(response.body.message);
      return;
    }

    setDetail(response.body);
    setNotice(`${response.body.organizer.name} moved to ${response.body.organizer.reviewStatus}.`);
    setOrganizers(await loadOrganizers(filter));
  }

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-xl shadow-slate-950/5">
        <div
          className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-brand-tint"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-orange-strong">
              A-02 · Organizer trust queue
            </p>
            <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight">
              Organizer review
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Review self-service organizer profiles, approve trusted teams, or request changes
              before publishing and payments are enabled.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {reviewFilters.map((item) => (
              <Button
                key={item}
                type="button"
                variant={filter === item ? "default" : "outline"}
                onClick={() => setFilter(item)}
              >
                {labelForReviewStatus(item)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Organizer review failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert className="border-success/30 bg-success/10 text-success-text">
          <AlertTitle>Review saved</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="In current filter" value={counts.total} status="info" />
        <Metric label="Pending" value={counts.pending} status="pending" />
        <Metric label="Needs action" value={counts.blocked} status="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-display text-3xl uppercase">Organizer queue</CardTitle>
            <CardDescription>
              {organizers ? `${organizers.length} organizers` : "Loading organizers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!organizers ? (
              <div className="grid gap-3">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            ) : organizers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-display text-2xl font-black uppercase">No organizers here</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Switch filters or wait for new self-service onboarding submissions.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {organizers.map((organizer) => (
                  <li key={organizer.id}>
                    <button
                      type="button"
                      className={`grid w-full gap-2 px-4 py-4 text-left transition hover:bg-muted/50 ${
                        selectedId === organizer.id ? "bg-brand-tint/70" : ""
                      }`}
                      onClick={() => setSelectedId(organizer.id)}
                    >
                      <span className="flex flex-wrap items-center justify-between gap-3">
                        <strong>{organizer.name}</strong>
                        <StatusBadge
                          status={statusKindForReview(organizer.reviewStatus)}
                          label={labelForReviewStatus(organizer.reviewStatus)}
                        />
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {organizer.legalName} · {organizer.city}, {organizer.state}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-display text-3xl uppercase">Review detail</CardTitle>
            <CardDescription>Approve only after profile details look trustworthy.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Select an organizer to inspect.</p>
            ) : !detail ? (
              <div className="grid gap-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-5">
                <div className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                  <StatusBadge
                    status={statusKindForReview(detail.organizer.reviewStatus)}
                    label={labelForReviewStatus(detail.organizer.reviewStatus)}
                  />
                  <p>
                    <strong className="block text-foreground">{detail.organizer.name}</strong>
                    <span className="text-muted-foreground">{detail.organizer.legalName}</span>
                  </p>
                  <p>
                    <strong>Owner email:</strong> {detail.organizer.ownerEmail}
                  </p>
                  <p>
                    <strong>Entity:</strong>{" "}
                    {detail.organizer.entityType === "gst" ? "GST" : "Non-GST"}
                  </p>
                  <p>
                    <strong>GSTIN:</strong> {detail.organizer.gstin ?? "Not applicable"}
                  </p>
                  <p>
                    <strong>Support:</strong> {detail.organizer.supportContact}
                  </p>
                  <p>
                    <strong>Finance:</strong> {detail.organizer.financeContact ?? "Not set"}
                  </p>
                  <p>
                    <strong>Billing:</strong> {detail.organizer.billingAddress ?? "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold">Members</p>
                  <ul className="mt-3 grid gap-2 text-sm">
                    {detail.memberships.map((membership) => (
                      <li key={membership.id} className="flex items-center justify-between gap-3">
                        <span>
                          <strong className="block">{membership.user.name}</strong>
                          <span className="text-muted-foreground">{membership.user.email}</span>
                        </span>
                        <StatusBadge status="info" label={membership.role} />
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleReview}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="reviewStatus">Review action</FieldLabel>
                      <select
                        id="reviewStatus"
                        name="reviewStatus"
                        defaultValue="approved"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {reviewActions.map((action) => (
                          <option key={action} value={action}>
                            {labelForReviewStatus(action)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="reviewReason">Review reason</FieldLabel>
                      <Textarea
                        id="reviewReason"
                        name="reviewReason"
                        rows={4}
                        placeholder="Required when changes are requested, rejected, or suspended."
                      />
                      <FieldDescription>
                        This is stored with the organizer review record.
                      </FieldDescription>
                    </Field>
                    <Button type="submit" disabled={isReviewing}>
                      {isReviewing ? "Saving..." : "Save review"}
                    </Button>
                  </FieldGroup>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, status }: { label: string; value: number; status: StatusKind }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="font-display text-4xl font-black">{value}</span>
          <StatusBadge status={status} label={label} />
        </div>
      </CardContent>
    </Card>
  );
}

async function loadOrganizers(filter: OrganizerReviewStatus | "all") {
  const response = await consoleApiClient.adminListOrganizers({
    headers: {},
    query: filter === "all" ? undefined : { reviewStatus: filter },
  });

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  return response.body.organizers;
}

async function loadOrganizerDetail(organizerId: string) {
  const response = await consoleApiClient.adminGetOrganizer({
    headers: {},
    params: { organizerId },
  });

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  return response.body;
}

function statusKindForReview(status: OrganizerReviewStatus): StatusKind {
  if (status === "approved") return "ok";
  if (status === "pending") return "pending";
  if (status === "changes-requested") return "warning";
  return "error";
}

function labelForReviewStatus(status: OrganizerReviewStatus | "all") {
  return status
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
