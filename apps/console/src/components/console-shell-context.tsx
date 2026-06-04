import { createContext, type PropsWithChildren, useContext, useMemo } from "react";

import type { MockPersona } from "../mocks/personas";
import type { DemoState } from "../mocks/types";

export type ConsoleShellContextValue = {
  activeEventId: string;
  setActiveEventId: (eventId: string) => void;
  persona: MockPersona;
  demo: DemoState;
};

const ConsoleShellContext = createContext<ConsoleShellContextValue | null>(null);

export function ConsoleShellProvider({
  activeEventId,
  setActiveEventId,
  persona,
  demo,
  children,
}: PropsWithChildren<ConsoleShellContextValue>) {
  const value = useMemo(
    () => ({ activeEventId, setActiveEventId, persona, demo }),
    [activeEventId, demo, persona, setActiveEventId],
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
