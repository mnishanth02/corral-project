import type { Coupon } from "./types";

export const participantCoupons: Coupon[] = [
  {
    code: "EARLYCBE",
    eventId: "coimbatore-marathon-2026",
    label: "Early-bird launch offer",
    discountType: "flat",
    discountValue: 200,
    active: true,
    expiresAt: "2026-01-31T23:59:59+05:30",
    minimumAmount: 1000,
  },
  {
    code: "RACECOURSE10",
    eventId: "coimbatore-marathon-2026",
    label: "Race Course Road community offer",
    discountType: "percent",
    discountValue: 10,
    active: true,
    expiresAt: "2026-03-31T23:59:59+05:30",
  },
  {
    code: "EXPIRED100",
    eventId: "coimbatore-marathon-2026",
    label: "Expired launch coupon",
    discountType: "flat",
    discountValue: 100,
    active: false,
    expiresAt: "2025-12-15T23:59:59+05:30",
  },
];

export const activeParticipantCoupon = participantCoupons[0] as Coupon;
