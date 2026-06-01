import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthClient, AuthSession } from "../lib/auth";
import { routeTree } from "../routeTree.gen";

vi.mock("../lib/api", () => ({
  apiClient: {
    check: vi.fn(async () => ({
      status: 200,
      body: {
        status: "ok",
        db: true,
        redis: true,
        uptime: 125,
        version: "test",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
    })),
  },
}));

function createSession(role: "admin" | "user" = "user") {
  return {
    user: {
      id: "user_1",
      email: "captain@example.com",
      emailVerified: true,
      name: "Race Captain",
      image: null,
      role,
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    session: {
      id: "session_1",
      userId: "user_1",
      token: "token",
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      ipAddress: null,
      userAgent: null,
    },
  } satisfies AuthSession;
}

function createAuthClient(session: AuthSession | null) {
  return {
    getSession: vi.fn(async () => ({ data: session, error: null })),
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
    },
    signOut: vi.fn(),
    admin: {
      listUsers: vi.fn(async () => ({ data: { users: [], total: 0 }, error: null })),
      createUser: vi.fn(),
    },
  } as unknown as AuthClient;
}

async function createLoadedRouter(path: string, authClient: AuthClient) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient, authClient },
  });

  await router.load();

  return { queryClient, router };
}

function renderLoadedRoute({
  queryClient,
  router,
}: Awaited<ReturnType<typeof createLoadedRouter>>) {
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

describe("auth routing", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("redirects unauthenticated dashboard visits to login with the intended destination", async () => {
    const { router } = await createLoadedRouter("/", createAuthClient(null));

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toEqual({ redirect: "/" });
  });

  it("renders the dashboard for authenticated users", async () => {
    renderLoadedRoute(await createLoadedRouter("/", createAuthClient(createSession())));

    expect(
      await screen.findByRole("heading", { name: /race-day control tower/i }),
    ).toBeInTheDocument();
  });

  it("shows access denied for non-admin user management visits", async () => {
    renderLoadedRoute(
      await createLoadedRouter("/admin/users", createAuthClient(createSession("user"))),
    );

    expect(await screen.findByText(/admin access required/i)).toBeInTheDocument();
  });
});
