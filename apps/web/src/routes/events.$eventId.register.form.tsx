import { Alert, AlertDescription, AlertTitle } from "@corral/ui/components/alert";
import { Button } from "@corral/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@corral/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@corral/ui/components/field";
import { Input } from "@corral/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@corral/ui/components/select";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { useStickyCta } from "../components/sticky-cta";
import { useRegistrationFlow } from "../mocks/store";
import type { ParticipantFormData } from "../mocks/types";
import { mockMutate } from "../mocks/utils";
import {
  ageGroupLabel,
  calculateAge,
  categoryById,
  findEvent,
  getDemo,
  RegisterScreen,
  validateRegisterSearch,
} from "./-register-components";

type Errors = Partial<Record<keyof ParticipantFormData | "club", string>>;

type FormDraft = ParticipantFormData & { club?: string };

export const Route = createFileRoute("/events/$eventId/register/form")({
  validateSearch: validateRegisterSearch,
  loader: ({ params }) => findEvent(params.eventId),
  component: FormRoute,
});

function validateForm(values: FormDraft): Errors {
  const errors: Errors = {};

  if (!values.firstName.trim()) errors.firstName = "⚠ Enter the runner's first name.";
  if (!values.lastName.trim()) errors.lastName = "⚠ Enter the runner's last name.";
  if (!/^\+?91?\s?[6-9]\d{4}\s?\d{5}$/.test(values.phone.replace(/-/g, ""))) {
    errors.phone = "⚠ Enter a valid 10-digit Indian mobile number.";
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) errors.email = "⚠ Enter a valid email.";
  if (!values.dateOfBirth) errors.dateOfBirth = "⚠ Add DOB to derive age group.";
  if (!values.emergencyContactName.trim())
    errors.emergencyContactName = "⚠ Add emergency contact name.";
  if (!/^\+?91?\s?[6-9]\d{4}\s?\d{5}$/.test(values.emergencyContactPhone.replace(/-/g, ""))) {
    errors.emergencyContactPhone = "⚠ Add a valid emergency phone.";
  }

  return errors;
}

function FormRoute() {
  const event = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const search = useSearch({ strict: false });
  const demo = getDemo(search);
  const flow = useRegistrationFlow();
  const navigate = useNavigate();
  const firstInvalidRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<FormDraft>({
    ...flow.participant,
    club: "Kongu Runners Club",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const category = categoryById(event, flow.selectedCategoryId);
  const age = calculateAge(values.dateOfBirth);
  const isMinor = age !== undefined && age < 18;
  const hasErrors = Object.keys(errors).length > 0;

  const submit = useCallback(async () => {
    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => firstInvalidRef.current?.focus(), 0);
      return;
    }

    setSubmitting(true);
    const result = await mockMutate(values, {
      demo,
      validationErrors: { email: "This demo keeps the email invalid until edited." },
    });
    setSubmitting(false);

    if (result.status === "validation-error") {
      setErrors({ email: "⚠ This demo keeps the email invalid until edited." });
      window.setTimeout(() => firstInvalidRef.current?.focus(), 0);
      return;
    }

    flow.updateParticipant(values);
    await navigate({
      to: isMinor ? "/events/$eventId/register/guardian" : "/events/$eventId/register/waiver",
      params: { eventId },
    });
  }, [values, demo, isMinor, eventId, navigate, flow]);

  const cta = useMemo(
    () => (
      <Button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="h-12 w-full rounded-2xl text-base shadow-lg shadow-orange-500/25"
      >
        {submitting ? "Saving…" : isMinor ? "Continue to guardian consent" : "Continue to waiver"}
      </Button>
    ),
    [submitting, isMinor, submit],
  );

  useStickyCta(cta);

  function update<Key extends keyof FormDraft>(key: Key, value: FormDraft[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function inputRef(name: keyof ParticipantFormData) {
    return errors[name] && !firstInvalidRef.current ? firstInvalidRef : undefined;
  }

  return (
    <RegisterScreen
      eyebrow="P-07 · Runner details"
      title="Tell us who is running."
      description="Inline validation stays on this screen; DOB derives the age-group and detects minors."
      demo={demo}
      demoUrls={[
        `/events/${event.id}/register/form?demo=default`,
        `/events/${event.id}/register/form?demo=empty`,
        `/events/${event.id}/register/form?demo=validation-error`,
        `/events/${event.id}/register/form?demo=success`,
      ]}
    >
      {isMinor ? (
        <Alert className="border-info/40 bg-info/10 text-info-text">
          <span aria-hidden="true">ⓘ</span>
          <AlertTitle>Minor detected</AlertTitle>
          <AlertDescription>
            This runner is under 18 — guardian consent is required before checkout.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="rounded-[2rem] border-orange-100">
        <CardHeader>
          <CardTitle className="font-display text-2xl text-brand-navy">
            {category?.name ?? "10K Open"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div
            aria-live="polite"
            className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground"
          >
            ✓ {ageGroupLabel(age)}
          </div>
          {hasErrors ? (
            <p className="text-danger-text text-sm" aria-live="polite">
              ⚠ Fix highlighted fields to continue.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="First name"
              name="firstName"
              autoComplete="given-name"
              value={values.firstName}
              error={errors.firstName}
              onChange={(value) => update("firstName", value)}
              refProp={inputRef("firstName")}
            />
            <TextField
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              value={values.lastName}
              error={errors.lastName}
              onChange={(value) => update("lastName", value)}
              refProp={inputRef("lastName")}
            />
          </div>
          <Field>
            <FieldLabel>Gender</FieldLabel>
            <Select
              value={values.gender}
              onValueChange={(value) => update("gender", value as ParticipantFormData["gender"])}
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <TextField
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            autoComplete="bday"
            value={values.dateOfBirth}
            error={errors.dateOfBirth}
            onChange={(value) => update("dateOfBirth", value)}
            refProp={inputRef("dateOfBirth")}
            help="DOB sets your age category."
          />
          <TextField
            label="Mobile"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            error={errors.phone}
            onChange={(value) => update("phone", value)}
            refProp={inputRef("phone")}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            error={errors.email}
            onChange={(value) => update("email", value)}
            refProp={inputRef("email")}
          />
          <TextField
            label="Emergency contact name"
            name="emergencyContactName"
            autoComplete="name"
            value={values.emergencyContactName}
            error={errors.emergencyContactName}
            onChange={(value) => update("emergencyContactName", value)}
            refProp={inputRef("emergencyContactName")}
          />
          <TextField
            label="Emergency contact phone"
            name="emergencyContactPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.emergencyContactPhone}
            error={errors.emergencyContactPhone}
            onChange={(value) => update("emergencyContactPhone", value)}
            refProp={inputRef("emergencyContactPhone")}
          />
          <Field>
            <FieldLabel>T-shirt size</FieldLabel>
            <Select
              value={values.tshirtSize}
              onValueChange={(value) =>
                update("tshirtSize", value as ParticipantFormData["tshirtSize"])
              }
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <TextField
            label="Club/team (optional)"
            name="club"
            autoComplete="organization"
            value={values.club ?? ""}
            error={errors.club}
            onChange={(value) => update("club", value)}
            help="Example: Kongu Runners Club"
          />
        </CardContent>
      </Card>
      <Button asChild variant="outline" className="h-11 w-full rounded-2xl bg-white">
        <Link to="/events/$eventId/register/category" params={{ eventId }}>
          Back to category
        </Link>
      </Button>
    </RegisterScreen>
  );
}

function TextField({
  label,
  name,
  value,
  error,
  help,
  onChange,
  refProp,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  help?: string;
  onChange: (value: string) => void;
  refProp?: React.RefObject<HTMLInputElement | null>;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        ref={refProp}
        id={name}
        name={name}
        value={value}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl"
      />
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}
