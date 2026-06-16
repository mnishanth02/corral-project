import type {
  PublicEventAvailability,
  PublicEventCategory,
  PublicEventDetail,
  PublicEventSummary,
} from "@corral/schema";
import { notFound } from "@tanstack/react-router";

import { participantEvents } from "../mocks/events";
import type { Category as MockCategory, Event as MockEvent, Money } from "../mocks/types";
import { publicApiClient } from "./api";

export type PublicDisplayFeeTier = {
  id: string;
  label: string;
  amount: Money;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export type PublicDisplayCategory = {
  id: string;
  eventId: string;
  name: string;
  distance: string;
  minAge: number | null;
  maxAge?: number | null;
  status: "available" | "early-bird" | "sold-out";
  capacity: number;
  registeredCount: number;
  feeTiers: PublicDisplayFeeTier[];
  includes: string[];
};

export type PublicDisplayEvent = {
  id: string;
  organizerSlug: string;
  slug: string;
  title: string;
  status: "published" | "sold-out";
  availability: PublicEventAvailability;
  city: string;
  venue: {
    name: string;
    addressLine1: string;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    mapUrl?: string;
  };
  startsAt: string;
  endsAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  organizerName: string;
  heroImageAlt: string;
  summary: string;
  categories: PublicDisplayCategory[];
  policies: {
    refund: string;
    waiver: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  raceInstructions?: string;
  medicalDeclaration?: string;
};

export async function fetchPublicEvents(): Promise<PublicDisplayEvent[]> {
  const response = await publicApiClient.listEvents();

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  return response.body.events.map(toPublicDisplayEvent);
}

export async function fetchPublicEvent(
  organizerSlug: string,
  eventSlug: string,
): Promise<PublicDisplayEvent> {
  const response = await publicApiClient.getEvent({
    params: { organizerSlug, eventSlug },
  });

  if (response.status === 404) {
    throw notFound();
  }

  return toPublicDisplayEvent(response.body.event);
}

export function demoPublicEvents(): PublicDisplayEvent[] {
  return participantEvents.map(toDemoDisplayEvent);
}

export function getDemoPublicEventOrThrow(eventSlug: string): PublicDisplayEvent {
  const event = demoPublicEvents().find((item) => item.slug === eventSlug || item.id === eventSlug);

  if (!event) {
    throw notFound();
  }

  return event;
}

export function publicEventPath(event: PublicDisplayEvent, suffix = ""): string {
  return `/events/${event.organizerSlug}/${event.slug}${suffix}`;
}

export function toPublicDisplayEvent(
  event: PublicEventSummary | PublicEventDetail,
): PublicDisplayEvent {
  const startsAt = event.startsAt ?? event.date ?? new Date().toISOString();
  const categories = event.categories.map(toDisplayCategory);
  const city = event.city ?? event.organizer.city;
  const venueName = event.venueName ?? "Venue to be announced";
  const contactEmail = "contactEmail" in event ? (event.contactEmail ?? undefined) : undefined;
  const contactPhone = "contactPhone" in event ? (event.contactPhone ?? undefined) : undefined;
  const mapUrl = "mapUrl" in event ? (event.mapUrl ?? undefined) : undefined;

  return {
    id: event.id,
    organizerSlug: event.organizerSlug,
    slug: event.slug,
    title: event.name,
    status: event.availability === "sold-out" ? "sold-out" : "published",
    availability: event.availability,
    city,
    venue: {
      name: venueName,
      addressLine1: event.venueAddress ?? venueName,
      locality: city,
      city,
      state: event.organizer.state,
      postalCode: "",
      landmark: mapUrl ? "Organizer map link available" : undefined,
      mapUrl,
    },
    startsAt,
    endsAt: startsAt,
    registrationOpensAt: event.registrationOpensAt ?? startsAt,
    registrationClosesAt: event.registrationClosesAt ?? startsAt,
    organizerName: event.organizer.name,
    heroImageAlt: `${event.name} event banner`,
    summary: event.description ?? `${event.name} by ${event.organizer.name}.`,
    categories,
    policies: {
      refund:
        "refundPolicy" in event && event.refundPolicy
          ? event.refundPolicy
          : "Refund policy will be shared by the organizer.",
      waiver:
        "waiverText" in event && event.waiverText
          ? event.waiverText
          : "Participants must confirm fitness and accept organizer safety instructions.",
    },
    contactEmail,
    contactPhone,
    raceInstructions:
      "raceInstructions" in event && event.raceInstructions ? event.raceInstructions : undefined,
    medicalDeclaration:
      "medicalDeclaration" in event && event.medicalDeclaration
        ? event.medicalDeclaration
        : undefined,
  };
}

function toDisplayCategory(category: PublicEventCategory): PublicDisplayCategory {
  const activeTier = category.feeTiers[0];
  const soldOut =
    category.status === "sold-out" || category.capacity - category.registeredCount <= 0;

  return {
    id: category.id,
    eventId: category.eventId,
    name: category.label,
    distance: category.distance,
    minAge: category.minAge,
    maxAge: category.maxAge,
    status: soldOut
      ? "sold-out"
      : activeTier?.label.toLowerCase().includes("early")
        ? "early-bird"
        : "available",
    capacity: category.capacity,
    registeredCount: category.registeredCount,
    feeTiers: category.feeTiers.map((tier) => ({
      id: tier.id,
      label: tier.label,
      amount: { currency: "INR", amount: tier.amountInPaise / 100 },
      startsAt: tier.startsAt ?? "",
      endsAt: tier.endsAt ?? "",
      active: tier.isActive,
    })),
    includes: ["Race entry", "BIB", "Finisher support"],
  };
}

function toDemoDisplayEvent(event: MockEvent): PublicDisplayEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    status: event.status === "sold-out" ? "sold-out" : "published",
    availability: event.status === "sold-out" ? "sold-out" : "registration-open",
    city: event.city,
    venue: event.venue,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    registrationOpensAt: event.startsAt,
    registrationClosesAt: event.registrationClosesAt,
    organizerName: event.organizerName,
    heroImageAlt: event.heroImageAlt,
    summary: event.summary,
    categories: event.categories.map(toDemoDisplayCategory),
    policies: event.policies,
    organizerSlug: "demo",
    raceInstructions: undefined,
    medicalDeclaration: undefined,
  };
}

function toDemoDisplayCategory(category: MockCategory): PublicDisplayCategory {
  return {
    ...category,
    status:
      category.status === "sold-out"
        ? "sold-out"
        : category.status === "early-bird"
          ? "early-bird"
          : "available",
  };
}
