import { Tabs, TabsList, TabsTrigger } from "@corral/ui/components/tabs";

const setupSteps = [
  { value: "basics", label: "Basics", path: "basics" },
  { value: "fees", label: "Fees", path: "fees" },
  { value: "form", label: "Form", path: "form" },
  { value: "branding", label: "Branding", path: "branding" },
  { value: "policies", label: "Policies", path: "policies" },
  { value: "publish", label: "Publish", path: "publish" },
] as const;

const resultsSteps = [
  { value: "upload", label: "Upload", path: "upload" },
  { value: "mapping", label: "Mapping", path: "mapping" },
  { value: "validate", label: "Validate", path: "validate" },
  { value: "preview", label: "Preview", path: "preview" },
  { value: "publish", label: "Publish", path: "publish" },
] as const;

type StepperProps = {
  eventId: string;
  activeStep?: string;
};

export function SetupStepper({ eventId, activeStep = "basics" }: StepperProps) {
  return (
    <Tabs
      value={activeStep}
      className="rounded-2xl border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-xl shadow-slate-950/15"
    >
      <TabsList className="h-auto w-full flex-wrap justify-start bg-sidebar-accent/70 p-1">
        {setupSteps.map((step) => (
          <TabsTrigger
            key={step.value}
            value={step.value}
            asChild
            className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground"
          >
            <a href={`/events/${eventId}/setup/${step.path}`}>{step.label}</a>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function ResultsStepper({ eventId, activeStep = "upload" }: StepperProps) {
  return (
    <Tabs
      value={activeStep}
      className="rounded-2xl border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-xl shadow-slate-950/15"
    >
      <TabsList className="h-auto w-full flex-wrap justify-start bg-sidebar-accent/70 p-1">
        {resultsSteps.map((step) => (
          <TabsTrigger
            key={step.value}
            value={step.value}
            asChild
            className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground"
          >
            <a href={`/events/${eventId}/results/${step.path}`}>{step.label}</a>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
