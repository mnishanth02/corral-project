import { Button } from "@corral/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { participantPersonas } from "../mocks/personas";
import type { DemoState, ParticipantPersona } from "../mocks/types";
import { demoStates } from "../mocks/utils";

type RootSearch = {
  demo?: DemoState;
  as?: ParticipantPersona;
};

function label(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DevDemoSwitcher() {
  const search = useSearch({ strict: false }) as RootSearch;
  const navigate = useNavigate();
  const demo = search.demo ?? "default";
  const persona = search.as ?? "public";

  async function updateSearch(key: "demo" | "as", value: string) {
    const url = new URL(window.location.href);

    if ((key === "demo" && value === "default") || (key === "as" && value === "public")) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }

    await navigate({ href: `${url.pathname}${url.search}${url.hash}`, replace: true });
  }

  async function resetDemo() {
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    url.searchParams.delete("as");
    await navigate({ href: `${url.pathname}${url.search}${url.hash}`, replace: true });
  }

  return (
    <aside className="fixed right-3 bottom-24 z-40 w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border border-orange-200/80 bg-white/95 p-3 text-xs shadow-2xl shadow-slate-950/15 backdrop-blur print:hidden">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-bold uppercase tracking-[0.22em] text-brand-orange-strong">Demo</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={resetDemo}
        >
          Reset
        </Button>
      </div>
      <div className="grid gap-2">
        <div className="grid gap-1">
          <span className="font-medium text-muted-foreground">State</span>
          <Select value={demo} onValueChange={(value) => void updateSearch("demo", value)}>
            <SelectTrigger className="h-9 w-full bg-background" aria-label="Demo state">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {demoStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {label(state)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <span className="font-medium text-muted-foreground">Persona</span>
          <Select value={persona} onValueChange={(value) => void updateSearch("as", value)}>
            <SelectTrigger className="h-9 w-full bg-background" aria-label="Participant persona">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {participantPersonas.map((state) => (
                <SelectItem key={state} value={state}>
                  {label(state)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}
