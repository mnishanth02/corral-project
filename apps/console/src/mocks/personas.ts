import type { AuthSession } from "../lib/auth";
import type { Capability, PersonaId, TeamRole } from "./types";

export type MockPersona = {
  id: PersonaId;
  label: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: TeamRole | "Corral Admin" | "Expired" | "Denied";
  capabilities: Capability[];
  organizerId?: string;
  impersonatingOrganizerId?: string;
  isAdmin: boolean;
  isSessionExpired: boolean;
  isAccessDenied: boolean;
};

export const rbacCapabilities = {
  Owner: [
    "events:read",
    "events:write",
    "events:publish",
    "roster:read",
    "roster:write",
    "roster:export",
    "bibs:manage",
    "comms:send",
    "results:manage",
    "certificates:manage",
    "payments:read",
    "payments:refund",
    "payments:export",
    "permissions:manage",
    "support:manage",
    "audit:read",
  ],
  Admin: [
    "events:read",
    "events:write",
    "events:publish",
    "roster:read",
    "roster:write",
    "roster:export",
    "bibs:manage",
    "comms:send",
    "results:manage",
    "certificates:manage",
    "payments:read",
    "payments:refund",
    "payments:export",
    "permissions:manage",
    "support:manage",
    "audit:read",
  ],
  "Event Editor": [
    "events:read",
    "events:write",
    "roster:read",
    "roster:write",
    "bibs:manage",
    "comms:send",
    "results:manage",
    "certificates:manage",
  ],
  Finance: [
    "events:read",
    "roster:read",
    "payments:read",
    "payments:refund",
    "payments:export",
    "audit:read",
  ],
  "Support/Check-in": [
    "events:read",
    "roster:read",
    "roster:write",
    "bibs:manage",
    "support:manage",
  ],
  "Read-only Viewer": ["events:read", "roster:read", "payments:read", "audit:read"],
} as const satisfies Record<TeamRole, Capability[]>;

const corralAdminCapabilities = [
  "admin:read",
  "admin:write",
  "admin:impersonate",
  "audit:read",
  "support:manage",
  "events:read",
  "payments:read",
] as const satisfies Capability[];

export const mockPersonas = {
  "org-owner": {
    id: "org-owner",
    label: "Organizer owner",
    user: {
      id: "user-priya-owner",
      name: "Priya Ramanathan",
      email: "priya@kovairoadclub.in",
    },
    role: "Owner",
    capabilities: rbacCapabilities.Owner,
    organizerId: "org-kovai-road-runners",
    isAdmin: false,
    isSessionExpired: false,
    isAccessDenied: false,
  },
  "org-staff": {
    id: "org-staff",
    label: "Organizer staff",
    user: {
      id: "user-arun-staff",
      name: "Arun Velusamy",
      email: "arun@kovairoadclub.in",
    },
    role: "Support/Check-in",
    capabilities: rbacCapabilities["Support/Check-in"],
    organizerId: "org-kovai-road-runners",
    isAdmin: false,
    isSessionExpired: false,
    isAccessDenied: false,
  },
  "org-readonly": {
    id: "org-readonly",
    label: "Read-only viewer",
    user: {
      id: "user-meera-readonly",
      name: "Meera Iyer",
      email: "meera@kovairoadclub.in",
    },
    role: "Read-only Viewer",
    capabilities: rbacCapabilities["Read-only Viewer"],
    organizerId: "org-kovai-road-runners",
    isAdmin: false,
    isSessionExpired: false,
    isAccessDenied: false,
  },
  "corral-admin": {
    id: "corral-admin",
    label: "Corral admin",
    user: {
      id: "user-corral-admin",
      name: "Nisha Menon",
      email: "nisha@corral.local",
    },
    role: "Corral Admin",
    capabilities: corralAdminCapabilities,
    isAdmin: true,
    isSessionExpired: false,
    isAccessDenied: false,
  },
  "corral-admin-impersonating": {
    id: "corral-admin-impersonating",
    label: "Corral admin impersonating",
    user: {
      id: "user-corral-admin",
      name: "Nisha Menon",
      email: "nisha@corral.local",
    },
    role: "Corral Admin",
    capabilities: [...corralAdminCapabilities, ...rbacCapabilities.Admin],
    organizerId: "org-kovai-road-runners",
    impersonatingOrganizerId: "org-kovai-road-runners",
    isAdmin: true,
    isSessionExpired: false,
    isAccessDenied: false,
  },
  "session-expired": {
    id: "session-expired",
    label: "Session expired",
    user: {
      id: "user-expired",
      name: "Expired Demo User",
      email: "expired@corral.local",
    },
    role: "Expired",
    capabilities: [],
    isAdmin: false,
    isSessionExpired: true,
    isAccessDenied: false,
  },
  "access-denied": {
    id: "access-denied",
    label: "Access denied",
    user: {
      id: "user-denied",
      name: "Denied Demo User",
      email: "denied@corral.local",
    },
    role: "Denied",
    capabilities: [],
    isAdmin: false,
    isSessionExpired: false,
    isAccessDenied: true,
  },
} as const satisfies Record<PersonaId, MockPersona>;

export const personaIds = Object.keys(mockPersonas) as PersonaId[];

export const personaStorageKey = "corral.console.mockPersona";

export function isPersonaId(value: unknown): value is PersonaId {
  return typeof value === "string" && value in mockPersonas;
}

export function getActivePersona(
  search = typeof window === "undefined" ? "" : window.location.search,
) {
  const params = new URLSearchParams(search);
  const queryPersona = params.get("as");

  if (isPersonaId(queryPersona)) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(personaStorageKey, queryPersona);
    }

    return mockPersonas[queryPersona];
  }

  if (typeof window !== "undefined") {
    const storedPersona = window.localStorage.getItem(personaStorageKey);

    if (isPersonaId(storedPersona)) {
      return mockPersonas[storedPersona];
    }
  }

  return mockPersonas["org-owner"];
}

export function hasCapability(
  persona: { capabilities: readonly Capability[] },
  capability: Capability,
) {
  return persona.capabilities.includes(capability);
}

export function getMockSession(persona: MockPersona = getActivePersona()): AuthSession | null {
  if (persona.isSessionExpired) {
    return null;
  }

  const now = new Date("2026-01-15T09:00:00+05:30");

  return {
    user: {
      ...persona.user,
      role: persona.isAdmin ? "admin" : "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: `mock-session-${persona.id}`,
      userId: persona.user.id,
      token: `mock-token-${persona.id}`,
      expiresAt: new Date("2026-12-31T23:59:59+05:30"),
      ipAddress: "127.0.0.1",
      userAgent: "Corral console mock mode",
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function getMockSessionResult(persona: MockPersona = getActivePersona()) {
  return Promise.resolve({
    data: getMockSession(persona),
    error: null,
  });
}
