import type { DemoState, ParticipantPersona } from "./types";
import { parseDemoState } from "./utils";

export const participantPersonas = [
  "public",
  "participant-returning",
  "participant-family",
  "session-expired",
  "access-denied",
] as const satisfies readonly ParticipantPersona[];

export const consoleCompatiblePersonas = [
  "org-owner",
  "org-staff",
  "org-readonly",
  "corral-admin",
  "corral-admin-impersonating",
] as const satisfies readonly ParticipantPersona[];

const personaSet = new Set<string>([...participantPersonas, ...consoleCompatiblePersonas]);

export type PersonaSearchState = {
  as: ParticipantPersona;
  demo: DemoState;
};

export function parseParticipantPersona(value: string | null | undefined): ParticipantPersona {
  return value && personaSet.has(value) ? (value as ParticipantPersona) : "public";
}

export function parsePersonaSearch(search: URLSearchParams): PersonaSearchState {
  return {
    as: parseParticipantPersona(search.get("as")),
    demo: parseDemoState(search.get("demo")),
  };
}

export function createPersonaSearchParams(state: Partial<PersonaSearchState>): URLSearchParams {
  const params = new URLSearchParams();

  if (state.as && state.as !== "public") {
    params.set("as", state.as);
  }

  if (state.demo && state.demo !== "default") {
    params.set("demo", state.demo);
  }

  return params;
}
