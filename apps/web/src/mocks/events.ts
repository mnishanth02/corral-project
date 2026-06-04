import type { Category, Event } from "./types";

export const coimbatoreMarathonCategories: Category[] = [
  {
    id: "cat-5k-fun-run",
    eventId: "coimbatore-marathon-2026",
    name: "5K Fun Run",
    distance: "5K",
    minAge: 8,
    status: "early-bird",
    capacity: 2000,
    registeredCount: 1240,
    feeTiers: [
      {
        id: "tier-5k-early",
        label: "Early bird",
        amount: { currency: "INR", amount: 799 },
        startsAt: "2025-12-01T00:00:00+05:30",
        endsAt: "2026-01-31T23:59:59+05:30",
        active: true,
      },
      {
        id: "tier-5k-regular",
        label: "Regular",
        amount: { currency: "INR", amount: 999 },
        startsAt: "2026-02-01T00:00:00+05:30",
        endsAt: "2026-06-15T23:59:59+05:30",
        active: false,
      },
    ],
    includes: ["Timing chip", "Finisher medal", "Breakfast", "Cotton tee"],
  },
  {
    id: "cat-10k-open",
    eventId: "coimbatore-marathon-2026",
    name: "10K Open",
    distance: "10K",
    minAge: 14,
    status: "available",
    capacity: 1500,
    registeredCount: 980,
    feeTiers: [
      {
        id: "tier-10k-early",
        label: "Early bird",
        amount: { currency: "INR", amount: 1499 },
        startsAt: "2025-12-01T00:00:00+05:30",
        endsAt: "2026-01-31T23:59:59+05:30",
        active: true,
      },
      {
        id: "tier-10k-regular",
        label: "Regular",
        amount: { currency: "INR", amount: 1799 },
        startsAt: "2026-02-01T00:00:00+05:30",
        endsAt: "2026-06-15T23:59:59+05:30",
        active: false,
      },
    ],
    includes: ["Timing chip", "Finisher medal", "Dri-fit tee", "Post-race breakfast"],
  },
  {
    id: "cat-21k-half-marathon",
    eventId: "coimbatore-marathon-2026",
    name: "21K Half Marathon",
    distance: "21K",
    minAge: 18,
    status: "sold-out",
    capacity: 750,
    registeredCount: 750,
    feeTiers: [
      {
        id: "tier-21k-early",
        label: "Early bird",
        amount: { currency: "INR", amount: 1999 },
        startsAt: "2025-12-01T00:00:00+05:30",
        endsAt: "2026-01-31T23:59:59+05:30",
        active: false,
      },
      {
        id: "tier-21k-regular",
        label: "Regular",
        amount: { currency: "INR", amount: 2499 },
        startsAt: "2026-02-01T00:00:00+05:30",
        endsAt: "2026-06-15T23:59:59+05:30",
        active: true,
      },
    ],
    includes: ["Timing chip", "Finisher medal", "Premium tee", "Recovery breakfast"],
  },
];

export const participantEvents: Event[] = [
  {
    id: "coimbatore-marathon-2026",
    slug: "coimbatore-marathon-2026",
    title: "Coimbatore Marathon 2026",
    status: "published",
    city: "Coimbatore",
    venue: {
      name: "CODISSIA Trade Fair Complex",
      addressLine1: "Avinashi Road",
      locality: "Race Course Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      postalCode: "641014",
      landmark: "Near Coimbatore International Airport",
    },
    startsAt: "2026-07-19T05:00:00+05:30",
    endsAt: "2026-07-19T11:00:00+05:30",
    registrationClosesAt: "2026-06-15T23:59:59+05:30",
    organizerName: "Coimbatore Runners Trust",
    heroImageAlt: "Runners lining up outside CODISSIA Trade Fair Complex at sunrise",
    summary: "A city race from CODISSIA through Race Course Road with 5K, 10K, and 21K categories.",
    categories: coimbatoreMarathonCategories,
    policies: {
      refund: "Refunds are available until 30 days before race day after payment gateway charges.",
      waiver:
        "Participants confirm fitness to run and agree to follow race-day safety instructions.",
    },
  },
];

export const featuredEvent = participantEvents[0] as Event;
