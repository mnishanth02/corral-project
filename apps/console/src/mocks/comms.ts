import type { CommsMessage, CommsTemplate } from "./types";

export const mockCommsTemplates = [
  {
    id: "tpl-confirmation-whatsapp",
    eventId: "coimbatore-marathon-2026",
    name: "Registration confirmation",
    channel: "WhatsApp",
    body: "Hi {{name}}, your {{distance}} entry for Coimbatore Marathon 2026 is confirmed. BIB: {{bibNumber}}.",
    variables: ["name", "distance", "bibNumber"],
    updatedAt: "2026-01-12T17:00:00+05:30",
  },
  {
    id: "tpl-kit-pickup-sms",
    eventId: "coimbatore-marathon-2026",
    name: "Kit pickup reminder",
    channel: "SMS",
    body: "Kit pickup at CODISSIA Hall C, 10 Jul 10 AM-7 PM. Bring ID and QR ticket.",
    variables: ["name"],
    updatedAt: "2026-01-14T12:30:00+05:30",
  },
  {
    id: "tpl-results-email",
    eventId: "coimbatore-marathon-2026",
    name: "Results published",
    channel: "Email",
    subject: "Your Coimbatore Marathon result is live",
    body: "Congratulations {{name}}. View your result and certificate from your Corral ticket.",
    variables: ["name"],
    updatedAt: "2026-01-15T09:45:00+05:30",
  },
] as const satisfies CommsTemplate[];

export const mockCommsMessages = [
  {
    id: "msg-confirmation-wave-1",
    eventId: "coimbatore-marathon-2026",
    templateId: "tpl-confirmation-whatsapp",
    audience: "New paid registrations",
    channel: "WhatsApp",
    status: "sent",
    sentAt: "2026-02-10T20:00:00+05:30",
    createdBy: "Arun Velusamy",
  },
  {
    id: "msg-kit-reminder",
    eventId: "coimbatore-marathon-2026",
    templateId: "tpl-kit-pickup-sms",
    audience: "All confirmed runners",
    channel: "SMS",
    status: "scheduled",
    scheduledFor: "2026-07-09T18:00:00+05:30",
    createdBy: "Priya Ramanathan",
  },
  {
    id: "msg-results-live",
    eventId: "pollachi-trail-run-2025",
    templateId: "tpl-results-email",
    audience: "Finishers only",
    channel: "Email",
    status: "failed",
    sentAt: "2025-12-14T14:10:00+05:30",
    createdBy: "Suresh Balasubramanian",
  },
] as const satisfies CommsMessage[];
