import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { mockEvents, mockOrganizers, useMockStore } from "../mocks";
import {
  AuditReasonBox,
  DetailCard,
  PageHeader,
  validateAdminDemoSearch,
} from "./-admin-screen-kit";

export const Route = createFileRoute("/admin/impersonate")({
  validateSearch: validateAdminDemoSearch,
  staticData: { breadcrumb: "Act on behalf" },
  component: AdminImpersonatePage,
});

function AdminImpersonatePage() {
  const { demo } = Route.useSearch();
  const { impersonation, setImpersonation, clearImpersonation } = useMockStore();
  const [organizerId, setOrganizerId] = useState<string>(mockOrganizers[0]?.id ?? "");
  const event = mockEvents.find((item) => item.organizerId === organizerId) ?? mockEvents[0];
  const organizer = mockOrganizers.find((item) => item.id === organizerId) ?? mockOrganizers[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="A-03 · Staff safety"
        title="Act-on-behalf"
        description="Select an organizer/event, record the audit reason, and set the persistent impersonation banner used across the admin shell."
        actions={
          <Button variant="outline" onClick={ () => clearImpersonation() }>
            Clear impersonation
          </Button>
        }
      />
      { demo === "success" || impersonation.organizerId ? (
        <Alert className="border-warning/40 bg-warning/10">
          <span aria-hidden="true">audit</span>
          <AlertTitle>Banner is active</AlertTitle>
          <AlertDescription>
            Acting on behalf of { organizer?.name } · { event.name } · staff: Nisha Menon. Exit from the
            global banner or this page.
          </AlertDescription>
        </Alert>
      ) : null }
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <DetailCard
          title="Choose context"
          description="Organizer and event context are persisted in the mock store; no backend calls are made."
        >
          <div className="grid gap-2 text-sm font-semibold">
            <span id="organizer-select-label">Organizer</span>
            <Select value={ organizerId } onValueChange={ setOrganizerId }>
              <SelectTrigger aria-labelledby="organizer-select-label">
                <SelectValue placeholder="Organizer" />
              </SelectTrigger>
              <SelectContent>
                { mockOrganizers.map((item) => (
                  <SelectItem key={ item.id } value={ item.id }>
                    { item.name }
                  </SelectItem>
                )) }
              </SelectContent>
            </Select>
          </div>
          <p>
            <strong>Event:</strong> { event.name } · { event.venueName }
          </p>
          <AuditReasonBox label="Why are you starting act-on-behalf?" />
          <ConfirmDialog
            trigger={
              <Button>
                <span aria-hidden="true">act</span> Start act-on-behalf
              </Button>
            }
            title="Start act-on-behalf session?"
            description="The banner cannot be dismissed without exiting. First sensitive change requires this audit reason. High-risk actions ask again."
            requireReason
            confirmLabel="Start session"
            onConfirm={ (reason) =>
              setImpersonation({
                adminUserId: "user-corral-admin",
                organizerId,
                reason,
                startedAt: new Date().toISOString(),
              })
            }
          />
        </DetailCard>
        <DetailCard
          title="Sensitive action gates"
          description="Every high-risk workflow repeats ConfirmDialog requireReason."
        >
          { [
            "First sensitive change",
            "Refunds",
            "PII exports",
            "Publish / unpublish",
            "Manual payment override",
          ].map((label) => (
            <StatusBadge key={ label } status="warning" label={ label } />
          )) }
          <Alert className="border-danger/30 bg-danger/10">
            <span aria-hidden="true">!</span>
            <AlertTitle>Never silent</AlertTitle>
            <AlertDescription>
              Staff changes are blocked until a non-empty audit reason is supplied.
            </AlertDescription>
          </Alert>
        </DetailCard>
      </div>
    </div>
  );
}
