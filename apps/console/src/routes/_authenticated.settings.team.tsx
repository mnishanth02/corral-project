import { AccessDenied } from "@corral/ui/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Badge } from "@corral/ui/components/badge";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import { ConfirmDialog } from "@corral/ui/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@corral/ui/components/dialog";
import { EmptyState } from "@corral/ui/components/empty-state";
import { Field, FieldDescription, FieldError, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge } from "@corral/ui/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@corral/ui/components/table";
import { Textarea } from "@corral/ui/components/textarea";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useId, useMemo, useState } from "react";

import { useConsoleShell } from "../components/console-shell-context";
import { hasCapability, mockTeamMembers, rbacCapabilities } from "../mocks";
import type { DemoState, TeamMember, TeamRole } from "../mocks/types";
import { teamRoles } from "../mocks/types";
import { formatDate, mockMutate, parseDemoState } from "../mocks/utils";

type TeamSearch = { demo: DemoState };

type InviteErrors = Partial<Record<"email" | "role", string>>;

const capabilityLabels: Array<[string, string]> = [
  ["events:write", "Event setup"],
  ["roster:write", "Roster updates"],
  ["comms:send", "Comms send"],
  ["payments:refund", "Refunds"],
  ["payments:export", "PII exports"],
  ["permissions:manage", "Team roles"],
];

export const Route = createFileRoute("/_authenticated/settings/team")({
  validateSearch: (search): TeamSearch => ({ demo: parseDemoState(search.demo) }),
  staticData: { breadcrumb: "Team" },
  component: TeamPage,
});

function roleTone(role: TeamRole) {
  if (role === "Owner" || role === "Admin") return "success" as const;
  if (role === "Finance") return "warning" as const;
  if (role === "Read-only Viewer") return "muted" as const;
  return "info" as const;
}

function statusFor(member: TeamMember) {
  if (member.status === "active") return <StatusBadge status="ok" label="Active" />;
  if (member.status === "invited") return <StatusBadge status="pending" label="Invite sent" />;
  return <StatusBadge status="neutral" label="Disabled" />;
}

function TeamPage() {
  const { demo } = Route.useSearch();
  const { activeEventId, persona } = useConsoleShell();
  const canManage = hasCapability(persona, "permissions:manage");
  const [inviteOpen, setInviteOpen] = useState(demo === "validation-error" || demo === "success");
  const [inviteErrors, setInviteErrors] = useState<InviteErrors>(
    demo === "validation-error" ? { email: "Enter a valid teammate email." } : {},
  );
  const [notice, setNotice] = useState<string | null>(
    demo === "success" ? "Invite sent to harish@kovairoadclub.in. It expires in 7 days." : null,
  );
  const [roleReason, setRoleReason] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("Finance");
  const emailId = useId();
  const roleId = useId();

  const isPermissionDenied = demo === "permission-denied" || !canManage;
  const members = useMemo(() => {
    if (demo === "empty") return mockTeamMembers.filter((member) => member.role === "Owner");
    if (demo === "success") {
      return [
        ...mockTeamMembers,
        {
          id: "tm-harish-invite",
          organizerId: "org-kovai-road-runners",
          name: "Harish Kumar",
          email: "harish@kovairoadclub.in",
          role: "Event Editor",
          status: "invited",
        } satisfies TeamMember,
      ];
    }
    return mockTeamMembers;
  }, [demo]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const role = String(form.get("role") ?? "").trim() as TeamRole;
    const nextErrors: InviteErrors = {};
    if (!email.includes("@")) nextErrors.email = "Enter a valid teammate email.";
    if (!role) nextErrors.role = "Choose a role.";
    if (Object.keys(nextErrors).length > 0 || demo === "validation-error") {
      setInviteErrors({
        ...nextErrors,
        ...(demo === "validation-error" ? { email: "Enter a valid teammate email." } : {}),
      });
      return;
    }
    const result = await mockMutate({ email, role }, { demo: "success" });
    setInviteErrors({});
    setNotice(
      result.message === "Saved successfully."
        ? `Invite sent to ${email}. It expires in 7 days.`
        : result.message,
    );
    setInviteOpen(false);
  }

  if (demo === "loading") return <TeamSkeleton />;

  if (isPermissionDenied) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <AccessDenied
          title="Only an Owner or Admin can manage team roles"
          description="Read-only and event support personas can view limited access context, but role changes and invites stay locked."
          roleContext={`${persona.user.name} · ${persona.role}`}
          actions={
            <Button asChild variant="outline">
              <Link to="/settings/team" search={{ demo: "default" }}>
                Return to default state
              </Link>
            </Button>
          }
        />
        <MembersTable members={members} readOnly />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-7 shadow-xl shadow-slate-950/5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">O-03A</Badge>
          <Badge variant="success">Owner/Admin access</Badge>
          <Badge variant="secondary">Event scope: {activeEventId}</Badge>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange-strong">
              Settings
            </p>
            <h1 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-tight">
              Team & Roles
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Invite staff, assign least-privilege event roles, and capture audit reasons for every
              sensitive role change.
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>Invite member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite member</DialogTitle>
                <DialogDescription>
                  We'll email an invite for the Coimbatore marathon workspace. Invites expire in 7
                  days.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="grid gap-5" noValidate>
                <Field>
                  <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                  <Input
                    id={emailId}
                    name="email"
                    type="email"
                    placeholder="harish@kovairoadclub.in"
                    aria-invalid={Boolean(inviteErrors.email)}
                    aria-describedby={inviteErrors.email ? `${emailId}-error` : undefined}
                  />
                  <FieldError id={`${emailId}-error`}>{inviteErrors.email}</FieldError>
                </Field>
                <Field>
                  <FieldLabel id={roleId}>Role</FieldLabel>
                  <Select name="role" defaultValue="Event Editor">
                    <SelectTrigger aria-labelledby={roleId} className="w-full">
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Finance/Admin can export PII or issue refunds; those actions require audit
                    reasons.
                  </FieldDescription>
                  <FieldError>{inviteErrors.role}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Optional message</FieldLabel>
                  <Textarea
                    name="message"
                    placeholder="Welcome to CODISSIA Run operations."
                    rows={3}
                  />
                </Field>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Send invite</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {notice ? (
        <Alert className="border-success/30 bg-success/10 text-success-text" aria-live="polite">
          <AlertTitle>Team update saved</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {demo === "offline" ? (
        <Alert className="border-warning/30 bg-warning/10 text-warning-text">
          <AlertTitle>Offline demo mode</AlertTitle>
          <AlertDescription>
            Role changes are disabled while offline. Invites remain local-only and no backend call
            is made.
          </AlertDescription>
        </Alert>
      ) : null}
      {demo === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Fake mutation failed</AlertTitle>
          <AlertDescription>
            Retry from the default demo; no team data was changed.
          </AlertDescription>
        </Alert>
      ) : null}

      <PermissionMatrix />

      {demo === "empty" ? (
        <EmptyState
          title="Invite your first teammate"
          description="Only Priya Ramanathan has access right now. Add finance and check-in owners before registrations open."
          action={<Button onClick={() => setInviteOpen(true)}>Invite member</Button>}
        />
      ) : null}

      <MembersTable
        members={members}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        roleReason={roleReason}
        setRoleReason={setRoleReason}
        onSaved={(reason) => {
          setNotice(`Role change recorded with audit reason: ${reason}`);
          setRoleReason("");
        }}
        disabled={demo === "offline"}
      />

      <Card className="rounded-[1.5rem] border-primary/30 bg-brand-tint/60">
        <CardHeader>
          <CardTitle className="font-display text-2xl uppercase">Demo URLs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link
            className="underline underline-offset-4"
            to="/settings/team"
            search={{ demo: "default" }}
          >
            Default list
          </Link>
          <Link
            className="underline underline-offset-4"
            to="/settings/team"
            search={{ demo: "empty" }}
          >
            Empty
          </Link>
          <Link
            className="underline underline-offset-4"
            to="/settings/team"
            search={{ demo: "validation-error" }}
          >
            Validation
          </Link>
          <Link
            className="underline underline-offset-4"
            to="/settings/team"
            search={{ demo: "permission-denied" }}
          >
            Permission denied
          </Link>
          <Link
            className="underline underline-offset-4"
            to="/settings/team"
            search={{ demo: "success" }}
          >
            Invite sent
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionMatrix() {
  return (
    <Card className="rounded-[1.5rem]">
      <CardHeader>
        <CardTitle className="font-display text-3xl uppercase">What each role can do</CardTitle>
        <CardDescription>
          Permission matrix uses explicit Allowed / Not allowed labels for accessibility and audit
          clarity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              {teamRoles.map((role) => (
                <TableHead key={role}>{role}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {capabilityLabels.map(([capability, label]) => (
              <TableRow key={capability}>
                <TableCell className="font-medium">{label}</TableCell>
                {teamRoles.map((role) => {
                  const allowed = rbacCapabilities[role].includes(capability as never);
                  return (
                    <TableCell
                      key={role}
                      className={allowed ? "text-success-text" : "text-muted-foreground"}
                    >
                      {allowed ? "✓ Allowed" : "● Not allowed"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type MembersTableProps = {
  members: TeamMember[];
  readOnly?: boolean;
  disabled?: boolean;
  selectedRole?: TeamRole;
  setSelectedRole?: (role: TeamRole) => void;
  roleReason?: string;
  setRoleReason?: (reason: string) => void;
  onSaved?: (reason: string) => void;
};

function MembersTable({
  members,
  readOnly = false,
  disabled = false,
  selectedRole = "Finance",
  setSelectedRole,
  roleReason = "",
  setRoleReason,
  onSaved,
}: MembersTableProps) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="font-display text-3xl uppercase">Members</CardTitle>
            <CardDescription>
              Team member contact details are used only to manage event access. Role changes are
              recorded in the audit log.
            </CardDescription>
          </div>
          <Input
            className="max-w-xs"
            placeholder="Search members"
            aria-label="Search team members"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-semibold">{member.name}</div>
                  <div className="text-muted-foreground text-xs">{member.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={roleTone(member.role)}>{member.role}</Badge>
                </TableCell>
                <TableCell>{statusFor(member)}</TableCell>
                <TableCell>
                  {member.lastActiveAt ? formatDate(member.lastActiveAt) : "Invite pending"}
                </TableCell>
                <TableCell className="text-right">
                  {readOnly ? (
                    <Badge variant="muted">Locked</Badge>
                  ) : member.role === "Owner" ? (
                    <Badge variant="outline">Owner locked</Badge>
                  ) : (
                    <ConfirmDialog
                      title={`Change ${member.name}'s role?`}
                      description="Role changes are sensitive and require a reason recorded in the audit log."
                      confirmLabel="Save role"
                      requireReason
                      reasonValue={roleReason}
                      onReasonChange={setRoleReason}
                      reasonPlaceholder="Why are you changing this role? (recorded in the audit log)"
                      onConfirm={(reason) =>
                        onSaved?.(reason ?? "Role updated for event operations")
                      }
                      confirmDisabled={disabled}
                      trigger={
                        <Button type="button" variant="outline" size="sm" disabled={disabled}>
                          Change role
                        </Button>
                      }
                    >
                      <Field>
                        <FieldLabel>New role</FieldLabel>
                        <Select
                          value={selectedRole}
                          onValueChange={(value) => setSelectedRole?.(value as TeamRole)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Admin and Finance unlock refunds or PII exports; those actions have their
                          own audit gates.
                        </FieldDescription>
                      </Field>
                    </ConfirmDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 rounded-[2rem]" />
      <Skeleton className="h-72 rounded-[1.5rem]" />
      <Skeleton className="h-96 rounded-[1.5rem]" />
    </div>
  );
}
