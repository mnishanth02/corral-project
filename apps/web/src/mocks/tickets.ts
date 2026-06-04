import type { Ticket } from "./types";

export const participantTickets: Ticket[] = [
  {
    id: "ticket-ananya-1042",
    registrationId: "reg-ananya-10k-confirmed",
    eventId: "coimbatore-marathon-2026",
    bibNumber: "1042",
    qrLabel: "CBE26-10K-1042",
    kitStatus: "ready",
    wave: "10K Wave A",
    reportingTime: "2026-07-19T05:15:00+05:30",
    gate: "CODISSIA Gate 2",
  },
  {
    id: "ticket-karthik-pending",
    registrationId: "reg-karthik-5k-pending",
    eventId: "coimbatore-marathon-2026",
    bibNumber: "TBD",
    qrLabel: "Payment pending",
    kitStatus: "not-ready",
    wave: "5K Wave B",
    reportingTime: "2026-07-19T06:00:00+05:30",
    gate: "CODISSIA Gate 1",
  },
  {
    id: "ticket-meera-collected",
    registrationId: "reg-meera-21k-cancelled",
    eventId: "coimbatore-marathon-2026",
    bibNumber: "2188",
    qrLabel: "CBE26-21K-2188",
    kitStatus: "collected",
    wave: "21K Elite",
    reportingTime: "2026-07-19T04:45:00+05:30",
    gate: "Race Course Road holding area",
  },
];

export const readyTicket = participantTickets[0] as Ticket;
