import type { Capability, ConsoleMeResponse, TeamRole } from "@corral/schema";
import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import type { DemoState } from "../mocks/types";

export type ConsolePersona = {
  id: string;
  label: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: TeamRole | "Corral Admin";
  capabilities: Capability[];
  organizerId?: string;
  isAdmin: boolean;
  isSessionExpired: false;
  isAccessDenied: false;
};

export type ConsoleShellContextValue = {
  activeEventId: string;
  setActiveEventId: (eventId: string) => void;
  persona: ConsolePersona;
  consoleContext: ConsoleMeResponse;
  demo: DemoState;
};

const ConsoleShellContext = createContext<ConsoleShellContextValue | null>(null);

export function ConsoleShellProvider({
  activeEventId,
  setActiveEventId,
  persona,
  consoleContext,
  demo,
  children,
}: PropsWithChildren<ConsoleShellContextValue>) {
  const value = useMemo(
    () => ({ activeEventId, setActiveEventId, persona, consoleContext, demo }),
    [activeEventId, consoleContext, demo, persona, setActiveEventId],
  );

  return <ConsoleShellContext.Provider value={value}>{children}</ConsoleShellContext.Provider>;
}

export function useConsoleShell() {
  const context = useContext(ConsoleShellContext);

  if (!context) {
    throw new Error("useConsoleShell must be used within ConsoleShellProvider");
  }

  return context;
}
