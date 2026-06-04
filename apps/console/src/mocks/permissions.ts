import { rbacCapabilities } from "./personas";
import type { Capability, ChecklistItem, Permission, TeamRole } from "./types";

const sensitiveCapabilities = new Set<Capability>([
  "events:publish",
  "payments:refund",
  "payments:export",
  "permissions:manage",
  "admin:impersonate",
  "roster:export",
]);

const permissionCapabilities: Capability[] = [
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
];

const roles = Object.keys(rbacCapabilities) as TeamRole[];

export const mockPermissions = roles.flatMap((role) =>
  permissionCapabilities.map(
    (capability) =>
      ({
        id: `${role.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${capability.replace(":", "-")}`,
        role,
        capability,
        allowed: (rbacCapabilities[role] as readonly Capability[]).includes(capability),
        auditReasonRequired: sensitiveCapabilities.has(capability),
      }) satisfies Permission,
  ),
);

export const mockChecklistItems = [
  {
    id: "check-basics",
    label: "Event basics and venue confirmed",
    status: "complete",
    ownerRole: "Event Editor",
    route: "/events/coimbatore-marathon-2026/setup/basics",
  },
  {
    id: "check-fees",
    label: "Fees and GST export reviewed",
    status: "complete",
    ownerRole: "Finance",
    route: "/events/coimbatore-marathon-2026/setup/fees",
  },
  {
    id: "check-payment-account",
    label: "Payment account verified for T+2/T+3 settlement",
    status: "complete",
    ownerRole: "Owner",
    route: "/onboarding/payment",
  },
  {
    id: "check-medical-roster",
    label: "Medical roster export owner assigned",
    status: "warning",
    ownerRole: "Support/Check-in",
    route: "/events/coimbatore-marathon-2026/roster/medical",
  },
  {
    id: "check-night-policy",
    label: "Night run refund policy missing",
    status: "blocked",
    ownerRole: "Admin",
    route: "/events/race-course-night-10k-2026/setup/policies",
  },
] as const satisfies ChecklistItem[];
