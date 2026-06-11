import type { AdminOrganizerMember, OrganizerSummary, TeamRole } from "@corral/schema";
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
import { Input } from "@corral/ui/components/input";
import { Skeleton } from "@corral/ui/components/skeleton";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { consoleApiClient } from "../lib/api";
import { type AuthUser, authClient } from "../lib/auth";

type AdminUsersState = {
  users: AuthUser[];
  organizers: OrganizerSummary[];
  memberships: AdminOrganizerMember[];
};

const roleOptions: TeamRole[] = [
  "Owner",
  "Admin",
  "Event Editor",
  "Finance",
  "Support/Check-in",
  "Read-only Viewer",
];

export const Route = createFileRoute("/admin/users")({
  staticData: { breadcrumb: "Users" },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const emailId = useId();
  const nameId = useId();
  const passwordId = useId();
  const [state, setState] = useState<AdminUsersState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadAdminUsers()
      .then(setState)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load console users.");
      });
  }, []);

  const membershipCountByUser = useMemo(() => {
    const counts = new Map<string, number>();

    for (const membership of state?.memberships ?? []) {
      counts.set(membership.user.id, (counts.get(membership.user.id) ?? 0) + 1);
    }

    return counts;
  }, [state?.memberships]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const organizerId = String(formData.get("organizerId") ?? "");
    const role = String(formData.get("role") ?? "Support/Check-in") as TeamRole;

    if (!email || !name || !password || !organizerId) {
      setError("Enter name, email, temporary password, organizer, and role.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const created = await authClient.admin.createUser({
        email,
        name,
        password,
        role: "user",
        data: { emailVerified: true },
      });

      if (created.error || !created.data?.user) {
        throw new Error(created.error?.message || "Could not create user.");
      }

      const membership = await consoleApiClient.adminCreateOrganizerMembership({
        headers: {},
        body: {
          userId: created.data.user.id,
          organizerId,
          role,
          status: "active",
        },
      });

      if (membership.status !== 201) {
        throw new Error(membership.body.message);
      }

      setState(await loadAdminUsers());
      setNotice(
        `Created ${created.data.user.email} and assigned ${role}. Share the temporary password out of band.`,
      );
      form.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create console user.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!state && !error) {
    return (
      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <Skeleton className="h-96 rounded-[2rem]" />
        <Skeleton className="h-96 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[26rem_1fr]">
      <Card className="h-fit rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display text-3xl uppercase">Create console user</CardTitle>
          <CardDescription>
            Accounts are Better Auth users. Assign organizer membership manually and share the
            temporary password out of band. Admin-created fallback users are marked email-verified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser}>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>User management failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {notice ? (
                <Alert>
                  <AlertTitle>User created</AlertTitle>
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor={nameId}>Name</FieldLabel>
                <Input id={nameId} name="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                <Input id={emailId} name="email" type="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor={passwordId}>Temporary password</FieldLabel>
                <Input id={passwordId} name="password" type="password" minLength={8} required />
                <FieldDescription>
                  Password reset email is log-only right now, so share this securely outside Corral.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="organizerId">Organizer</FieldLabel>
                <select
                  id="organizerId"
                  name="organizerId"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Choose organizer</option>
                  {state?.organizers.map((organizer) => (
                    <option key={organizer.id} value={organizer.id}>
                      {organizer.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <select
                  id="role"
                  name="role"
                  defaultValue="Support/Check-in"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Creating..." : "Create user"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display text-3xl uppercase">Console users</CardTitle>
          <CardDescription>
            {state?.users.length ?? 0} Better Auth users · {state?.memberships.length ?? 0}{" "}
            organizer memberships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-secondary px-4 py-3 text-sm font-semibold">
              <span>User</span>
              <span>Auth role</span>
              <span>Memberships</span>
            </div>
            <ul className="divide-y divide-border">
              {state?.users.map((user) => (
                <li
                  key={user.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-4 text-sm"
                >
                  <span>
                    <strong className="block text-foreground">{user.name}</strong>
                    <span className="text-muted-foreground">{user.email}</span>
                  </span>
                  <StatusBadge
                    status={user.role === "admin" ? "warning" : "ok"}
                    label={Array.isArray(user.role) ? user.role.join(", ") : user.role || "user"}
                  />
                  <span className="text-muted-foreground">
                    {membershipCountByUser.get(user.id) ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-border bg-secondary px-4 py-3 text-sm font-semibold">
              <span>Member</span>
              <span>Organizer</span>
              <span>Role</span>
            </div>
            <ul className="divide-y divide-border">
              {state?.memberships.map((membership) => (
                <li
                  key={membership.id}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 px-4 py-4 text-sm"
                >
                  <span>
                    <strong className="block text-foreground">{membership.user.name}</strong>
                    <span className="text-muted-foreground">{membership.user.email}</span>
                  </span>
                  <span>{membership.organizer.name}</span>
                  <StatusBadge status="info" label={membership.role} />
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function loadAdminUsers(): Promise<AdminUsersState> {
  const [users, organizers, memberships] = await Promise.all([
    authClient.admin.listUsers({
      query: { limit: 100, offset: 0, sortBy: "createdAt", sortDirection: "desc" },
    }),
    consoleApiClient.adminListOrganizers({ headers: {}, query: undefined }),
    consoleApiClient.adminListOrganizerMembers({ headers: {} }),
  ]);

  if (users.error || !users.data) {
    throw new Error(users.error?.message || "Could not load Better Auth users.");
  }

  if (organizers.status !== 200) {
    throw new Error(organizers.body.message);
  }

  if (memberships.status !== 200) {
    throw new Error(memberships.body.message);
  }

  return {
    users: users.data.users,
    organizers: organizers.body.organizers,
    memberships: memberships.body.memberships,
  };
}
