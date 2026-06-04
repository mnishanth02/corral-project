import {
  createContext,
  createElement,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { mockEvents } from "./events";
import { mockResults } from "./results";
import type { EventSetupDraft, ResultsUploadDraft } from "./types";

export type ImpersonationState = {
  adminUserId?: string;
  organizerId?: string;
  reason?: string;
  startedAt?: string;
};

type MockStoreState = {
  eventSetupDrafts: Record<string, EventSetupDraft>;
  resultsUploadDrafts: Record<string, ResultsUploadDraft>;
  impersonation: ImpersonationState;
};

type MockStoreContextValue = MockStoreState & {
  updateEventSetupDraft: (eventId: string, patch: Partial<EventSetupDraft>) => void;
  updateResultsUploadDraft: (eventId: string, patch: Partial<ResultsUploadDraft>) => void;
  setImpersonation: (state: ImpersonationState) => void;
  clearImpersonation: () => void;
  resetMockStore: () => void;
};

const storageKey = "corral.console.mockStore";

function buildInitialState(): MockStoreState {
  return {
    eventSetupDrafts: Object.fromEntries(
      mockEvents.map((event) => [
        event.id,
        {
          eventId: event.id,
          basics: {
            name: event.name,
            date: event.date,
            startTime: event.startTime,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            city: event.city,
          },
          categories: event.categories,
          formFields: ["Full name", "Mobile", "Email", "Emergency contact", "T-shirt size"],
          brandColor: "#ff5a00",
          policyUrls: [
            "/privacy",
            `/events/${event.id}/policy/refund`,
            `/events/${event.id}/policy/waiver`,
          ],
          readyToPublish: event.setup.blockers.every((blocker) => blocker.status === "complete"),
        } satisfies EventSetupDraft,
      ]),
    ),
    resultsUploadDrafts: Object.fromEntries(
      mockEvents.map((event) => [
        event.id,
        {
          eventId: event.id,
          fileName: event.status === "completed" ? "coimbatore-marathon-results.csv" : undefined,
          mappedColumns: {
            bib: "Bib Number",
            chipTime: "Chip Time",
            gunTime: "Gun Time",
            status: "Status",
          },
          validationErrors: [],
          previewRows: mockResults.filter((result) => result.eventId === event.id),
          publishStatus: event.status === "completed" ? "published" : "not-started",
        } satisfies ResultsUploadDraft,
      ]),
    ),
    impersonation: {},
  };
}

function readInitialState() {
  if (typeof window === "undefined") {
    return buildInitialState();
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return buildInitialState();
  }

  try {
    return { ...buildInitialState(), ...(JSON.parse(stored) as Partial<MockStoreState>) };
  } catch {
    return buildInitialState();
  }
}

function persistState(state: MockStoreState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }
}

const MockStoreContext = createContext<MockStoreContextValue | null>(null);

export function MockStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<MockStoreState>(readInitialState);

  const commitState = useCallback((nextState: MockStoreState) => {
    setState(nextState);
    persistState(nextState);
  }, []);

  const updateEventSetupDraft = useCallback(
    (eventId: string, patch: Partial<EventSetupDraft>) => {
      const current = state.eventSetupDrafts[eventId];
      const nextDraft: EventSetupDraft = {
        basics: {
          name: "",
          date: "",
          startTime: "",
          venueName: "",
          venueAddress: "",
          city: "Coimbatore",
        },
        categories: [],
        formFields: [],
        brandColor: "#ff5a00",
        policyUrls: [],
        readyToPublish: false,
        ...current,
        ...patch,
        eventId,
      };
      const nextState = {
        ...state,
        eventSetupDrafts: {
          ...state.eventSetupDrafts,
          [eventId]: nextDraft,
        },
      };
      commitState(nextState);
    },
    [commitState, state],
  );

  const updateResultsUploadDraft = useCallback(
    (eventId: string, patch: Partial<ResultsUploadDraft>) => {
      const current = state.resultsUploadDrafts[eventId];
      const nextDraft: ResultsUploadDraft = {
        mappedColumns: {},
        validationErrors: [],
        previewRows: [],
        publishStatus: "not-started",
        ...current,
        ...patch,
        eventId,
      };
      const nextState = {
        ...state,
        resultsUploadDrafts: {
          ...state.resultsUploadDrafts,
          [eventId]: nextDraft,
        },
      };
      commitState(nextState);
    },
    [commitState, state],
  );

  const setImpersonation = useCallback(
    (impersonation: ImpersonationState) => {
      commitState({ ...state, impersonation });
    },
    [commitState, state],
  );

  const clearImpersonation = useCallback(() => {
    commitState({ ...state, impersonation: {} });
  }, [commitState, state]);

  const resetMockStore = useCallback(() => {
    const nextState = buildInitialState();
    commitState(nextState);
  }, [commitState]);

  const value = useMemo(
    () => ({
      ...state,
      updateEventSetupDraft,
      updateResultsUploadDraft,
      setImpersonation,
      clearImpersonation,
      resetMockStore,
    }),
    [
      state,
      updateEventSetupDraft,
      updateResultsUploadDraft,
      setImpersonation,
      clearImpersonation,
      resetMockStore,
    ],
  );

  return createElement(MockStoreContext.Provider, { value }, children);
}

export function useMockStore() {
  const context = useContext(MockStoreContext);

  if (!context) {
    throw new Error("useMockStore must be used within MockStoreProvider");
  }

  return context;
}
