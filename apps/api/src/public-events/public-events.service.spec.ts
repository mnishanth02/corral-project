import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicEventsApiError, PublicEventsService } from "./public-events.service";

const { queryClient } = vi.hoisted(() => ({
  queryClient: vi.fn(),
}));

vi.mock("@corral/db", () => ({
  queryClient,
}));

const publishedEventRow = {
  id: "evt-1",
  organizer_id: "org-1",
  organizer_slug: "kovai-road-runners",
  organizer_name: "Kovai Road Runners",
  organizer_city: "Coimbatore",
  organizer_state: "Tamil Nadu",
  organizer_support_contact: "support@example.com",
  slug: "coimbatore-10k",
  name: "Coimbatore 10K",
  date: "2026-08-09",
  starts_at: "2026-08-09T00:30:00.000Z",
  venue_name: "VOC Park",
  venue_address: "VOC Park, Coimbatore",
  city: "Coimbatore",
  timezone: "Asia/Kolkata",
  registration_opens_at: "2025-01-01T00:00:00.000Z",
  registration_closes_at: "2099-01-01T00:00:00.000Z",
  description: "A city race.",
  map_url: "https://maps.example/race",
  contact_email: "race@example.com",
  contact_phone: null,
  race_instructions: "Arrive early.",
  waiver_text: "I accept.",
  refund_policy: "No refunds after close.",
  medical_declaration: "I am fit.",
  form_fields: ["dateOfBirth", "emergencyContact"],
  tshirt_sizes: ["S", "M"],
  logo_url: null,
  banner_url: null,
  published_at: new Date("2026-01-01T00:00:00.000Z"),
};

const categoryRows = [
  {
    id: "cat-10k",
    event_id: "evt-1",
    label: "10K Open",
    distance: "10K",
    min_age: 14,
    max_age: null,
    capacity: 500,
    registered_count: 125,
    sort_order: 0,
    status: "active",
  },
  {
    id: "cat-sold-out",
    event_id: "evt-1",
    label: "21K",
    distance: "21K",
    min_age: 18,
    max_age: null,
    capacity: 100,
    registered_count: 100,
    sort_order: 1,
    status: "sold-out",
  },
];

const feeRows = [
  {
    id: "tier-early",
    category_id: "cat-10k",
    label: "Early bird",
    amount_in_paise: 120_000,
    starts_at: null,
    ends_at: null,
    registration_cap: null,
    registration_count: 0,
    is_active: true,
  },
  {
    id: "tier-regular",
    category_id: "cat-sold-out",
    label: "Regular",
    amount_in_paise: 180_000,
    starts_at: null,
    ends_at: null,
    registration_cap: null,
    registration_count: 100,
    is_active: true,
  },
];

describe("PublicEventsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists published approved-organizer events with public-safe fields", async () => {
    queryClient
      .mockResolvedValueOnce([publishedEventRow])
      .mockResolvedValueOnce(categoryRows)
      .mockResolvedValueOnce(feeRows);

    const response = await new PublicEventsService().listEvents();

    expect(response.events).toHaveLength(1);
    expect(response.events[0]).toMatchObject({
      id: "evt-1",
      organizerSlug: "kovai-road-runners",
      slug: "coimbatore-10k",
      availability: "registration-open",
      organizer: {
        slug: "kovai-road-runners",
        name: "Kovai Road Runners",
      },
    });
    expect(response.events[0]).not.toHaveProperty("publishedByUserId");
    expect(response.events[0]?.categories).toHaveLength(2);
  });

  it("looks up duplicate event slugs by organizer slug plus event slug", async () => {
    queryClient
      .mockResolvedValueOnce([publishedEventRow])
      .mockResolvedValueOnce(categoryRows)
      .mockResolvedValueOnce(feeRows);

    const response = await new PublicEventsService().getEvent(
      "kovai-road-runners",
      "coimbatore-10k",
    );

    expect(response.event.organizerSlug).toBe("kovai-road-runners");
    expect(response.event.slug).toBe("coimbatore-10k");
    expect(response.event.formFields).toEqual(["dateOfBirth", "emergencyContact"]);
    expect(response.event.publishedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(queryClient).toHaveBeenCalledTimes(3);
  });

  it("returns the same 404 for unpublished, missing, or unapproved events", async () => {
    queryClient.mockResolvedValueOnce([]);

    await expect(
      new PublicEventsService().getEvent("kovai-road-runners", "draft-event"),
    ).rejects.toMatchObject({
      status: 404,
      message: "Event was not found.",
    } satisfies Partial<PublicEventsApiError>);
  });

  it("excludes hidden categories from public responses", async () => {
    queryClient
      .mockResolvedValueOnce([publishedEventRow])
      .mockResolvedValueOnce(categoryRows)
      .mockResolvedValueOnce(feeRows);

    const response = await new PublicEventsService().getEvent(
      "kovai-road-runners",
      "coimbatore-10k",
    );

    expect(response.event.categories.map((category) => category.id)).not.toContain("cat-hidden");
  });

  it("marks events sold out when every public category has no seats", async () => {
    queryClient
      .mockResolvedValueOnce([publishedEventRow])
      .mockResolvedValueOnce([categoryRows[1]])
      .mockResolvedValueOnce([feeRows[1]]);

    const response = await new PublicEventsService().getEvent(
      "kovai-road-runners",
      "coimbatore-10k",
    );

    expect(response.event.availability).toBe("sold-out");
  });
});
