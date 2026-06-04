import type { Job, OpsHealth } from "./types";

export const mockJobs = [
  {
    id: "job-whatsapp-webhook-reconcile",
    name: "WhatsApp webhook reconciliation",
    status: "webhook-pending",
    attempts: 2,
    lastRunAt: "2026-02-10T20:10:00+05:30",
    nextRunAt: "2026-02-10T20:20:00+05:30",
    details: "3 delivery callbacks pending for Coimbatore Marathon 2026",
  },
  {
    id: "job-payment-settlement-sync",
    name: "Payment settlement sync",
    status: "running",
    attempts: 1,
    lastRunAt: "2026-02-11T09:00:00+05:30",
    details: "Reconciling T+2/T+3 settlement batches",
  },
  {
    id: "job-certificate-render",
    name: "Certificate render queue",
    status: "succeeded",
    attempts: 1,
    lastRunAt: "2025-12-14T14:30:00+05:30",
    nextRunAt: "2026-07-12T13:30:00+05:30",
    details: "Pollachi Trail Run certificates generated and sent",
  },
  {
    id: "job-gst-export",
    name: "GST export generation",
    status: "failed",
    attempts: 3,
    lastRunAt: "2026-02-11T08:45:00+05:30",
    nextRunAt: "2026-02-11T09:15:00+05:30",
    details: "Demo failure state for finance export retry",
  },
] as const satisfies Job[];

export const mockOpsHealth = [
  {
    id: "health-console",
    name: "Console app",
    status: "operational",
    latencyMs: 42,
    checkedAt: "2026-02-11T09:05:00+05:30",
    notes: "Frontend-only demo mode serving fixtures locally",
  },
  {
    id: "health-delivery",
    name: "Delivery callbacks",
    status: "degraded",
    latencyMs: 840,
    checkedAt: "2026-02-11T09:05:00+05:30",
    notes: "Webhook-pending demo rows are visible in delivery monitor",
  },
  {
    id: "health-payment-webhooks",
    name: "Payment webhooks",
    status: "degraded",
    latencyMs: 620,
    checkedAt: "2026-02-11T09:05:00+05:30",
    notes: "Paid — Awaiting Webhook payments remain deterministic",
  },
] as const satisfies OpsHealth[];
