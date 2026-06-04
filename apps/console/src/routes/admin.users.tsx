import { AccessDenied } from "@corral/ui/components/access-denied";
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
import { StatusBadge } from "@corral/ui/components/status-badge";
import { createFileRoute } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";

import { getActivePersona, mockTeamMembers } from "../mocks";
import type { TeamRole } from "../mocks/types";

type MockConsoleUser = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "invited";
};

export const Route = createFileRoute("/admin/users")({
  staticData: { breadcrumb: "Users" },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const emailId = useId();
  const nameId = useId();
  const persona = getActivePersona();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [users, setUsers] = useState<MockConsoleUser[]>(() =>
    mockTeamMembers.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
    })),
  );

  const canManageUsers = persona.isAdmin;
  const adminCount = useMemo(
    () => users.filter((user) => user.role === "Admin" || user.role === "Owner").length,
    [users],
  );

  if (!canManageUsers) {
    return (
      <AccessDenied
        title="Admin access required"
        description="Use the corral-admin persona to manage console users in frontend mock mode."
        roleContext={persona.role}
        actions={
          <Button asChild>
            <a href="/admin/users?as=corral-admin">Switch to admin</a>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
      <Card className="h-fit rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display text-3xl uppercase">Create mock user</CardTitle>
          <CardDescription>
            No backend calls. This only updates the in-memory demo table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setUsers((current) => [
                {
                  id: `mock-user-${Date.now()}`,
                  name,
                  email,
                  role: "Support/Check-in",
                  status: "invited",
                },
                ...current,
              ]);
              setEmail("");
              setName("");
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={nameId}>Name</FieldLabel>
                <Input
                  id={nameId}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                <Input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <FieldDescription>Mock users default to Support/Check-in.</FieldDescription>
              </Field>
              <Button type="submit">Create mock user</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem]">
        <CardHeader>
          <CardTitle className="font-display text-3xl uppercase">Console users</CardTitle>
          <CardDescription>
            {users.length} mock users · {adminCount} elevated roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border bg-secondary px-4 py-3 text-sm font-semibold">
              <span>User</span>
              <span>Role</span>
            </div>
            <ul className="divide-y divide-border">
              {users.map((user) => (
                <li key={user.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 text-sm">
                  <span>
                    <strong className="block text-foreground">{user.name}</strong>
                    <span className="text-muted-foreground">
                      {user.email} · {user.status}
                    </span>
                  </span>
                  <StatusBadge
                    status={user.role === "Owner" || user.role === "Admin" ? "warning" : "ok"}
                    label={user.role}
                  />
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
