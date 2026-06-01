import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@corral/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import { Spinner } from "@corral/ui/components/spinner";
import { StatusBadge } from "@corral/ui/components/status-badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useId, useState } from "react";

import { isAdminUser } from "../lib/auth";

const usersQueryKey = ["auth", "admin", "users"] as const;

type CreateUserInput = {
  email: string;
  name: string;
  password: string;
};

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async ({ context, location }) => {
    const result = await context.authClient.getSession();

    if (!result.data) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    return { session: result.data };
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const emailId = useId();
  const nameId = useId();
  const passwordId = useId();
  const queryClient = useQueryClient();
  const { authClient, session } = Route.useRouteContext();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const isAdmin = isAdminUser(session.user);

  const usersQuery = useQuery({
    queryKey: usersQueryKey,
    enabled: isAdmin,
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit: 50,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (result.error || !result.data) {
        throw new Error(result.error?.message ?? "Unable to load console users.");
      }

      return result.data;
    },
  });

  const createUser = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const result = await authClient.admin.createUser({
        ...input,
        role: "user",
      });

      if (result.error || !result.data) {
        throw new Error(result.error?.message ?? "Unable to create console user.");
      }

      return result.data.user;
    },
    onSuccess: async () => {
      setEmail("");
      setName("");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-3xl">
          <Alert variant="destructive">
            <AlertTitle>Admin access required</AlertTitle>
            <AlertDescription>
              Your Corral account can open the console, but only admins can manage users.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[24rem_1fr]">
        <Card className="h-fit rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-display text-3xl uppercase">Create user</CardTitle>
            <CardDescription>Invite a default user-role account into Corral.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                createUser.mutate({ email, name, password });
              }}
            >
              <FieldGroup>
                {createUser.isError ? (
                  <Alert variant="destructive">
                    <AlertTitle>User creation failed</AlertTitle>
                    <AlertDescription>{createUser.error.message}</AlertDescription>
                  </Alert>
                ) : null}

                <Field>
                  <FieldLabel htmlFor={nameId}>Name</FieldLabel>
                  <Input
                    id={nameId}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={createUser.isPending}
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
                    disabled={createUser.isPending}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor={passwordId}>Temporary password</FieldLabel>
                  <Input
                    id={passwordId}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={createUser.isPending}
                    minLength={8}
                    required
                  />
                  <FieldDescription>Share securely outside Corral.</FieldDescription>
                </Field>

                <FieldError>{createUser.isError ? createUser.error.message : null}</FieldError>

                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? <Spinner /> : null}
                  Create user
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="font-display text-3xl uppercase">Console users</CardTitle>
            <CardDescription>Admin plugin user listing from Better Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Loading users
              </div>
            ) : null}

            {usersQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to load users</AlertTitle>
                <AlertDescription>{usersQuery.error.message}</AlertDescription>
              </Alert>
            ) : null}

            {usersQuery.data ? (
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border bg-secondary px-4 py-3 text-sm font-semibold">
                  <span>{usersQuery.data.total} users</span>
                  <span>Role</span>
                </div>
                <ul className="divide-y divide-border">
                  {usersQuery.data.users.map((user) => (
                    <li key={user.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4 text-sm">
                      <span>
                        <strong className="block text-foreground">{user.name}</strong>
                        <span className="text-muted-foreground">{user.email}</span>
                      </span>
                      <StatusBadge
                        status={isAdminUser(user) ? "warning" : "ok"}
                        label={String(user.role ?? "user")}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
