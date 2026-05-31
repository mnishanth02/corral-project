import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { IndexPage } from "./-page";

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

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("IndexPage", () => {
  it("renders healthy system status labels", async () => {
    renderWithQueryClient(<IndexPage />);

    expect(screen.getByRole("heading", { name: /system status/i })).toBeInTheDocument();
    expect(await screen.findByText("API: OK")).toBeInTheDocument();
    expect(screen.getByText("DB: OK")).toBeInTheDocument();
    expect(screen.getByText("Redis: OK")).toBeInTheDocument();
  });
});
