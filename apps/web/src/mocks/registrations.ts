import type { Registration, RegistrationFlowState } from "./types";

export const participantRegistrations: Registration[] = [
  {
    id: "reg-ananya-10k-confirmed",
    eventId: "coimbatore-marathon-2026",
    categoryId: "cat-10k-open",
    participantName: "Ananya Krishnan",
    participantEmail: "ananya.krishnan@example.test",
    status: "confirmed",
    paymentStatus: "confirmed",
    couponCode: "EARLYCBE",
    orderSummary: {
      categoryFee: { currency: "INR", amount: 1499 },
      insurancePremium: { currency: "INR", amount: 149 },
      discount: { currency: "INR", amount: 200 },
      platformFee: { currency: "INR", amount: 35 },
      total: { currency: "INR", amount: 1483 },
    },
    createdAt: "2026-01-12T10:20:00+05:30",
    confirmedAt: "2026-01-12T10:36:00+05:30",
  },
  {
    id: "reg-karthik-5k-pending",
    eventId: "coimbatore-marathon-2026",
    categoryId: "cat-5k-fun-run",
    participantName: "Karthik Narayanan",
    participantEmail: "karthik.narayanan@example.test",
    status: "payment-pending",
    paymentStatus: "pending",
    orderSummary: {
      categoryFee: { currency: "INR", amount: 799 },
      insurancePremium: { currency: "INR", amount: 99 },
      discount: { currency: "INR", amount: 0 },
      platformFee: { currency: "INR", amount: 25 },
      total: { currency: "INR", amount: 923 },
    },
    createdAt: "2026-01-20T18:15:00+05:30",
  },
  {
    id: "reg-meera-21k-cancelled",
    eventId: "coimbatore-marathon-2026",
    categoryId: "cat-21k-half-marathon",
    participantName: "Meera Subramanian",
    participantEmail: "meera.subramanian@example.test",
    status: "cancelled",
    paymentStatus: "refunded",
    orderSummary: {
      categoryFee: { currency: "INR", amount: 2499 },
      insurancePremium: { currency: "INR", amount: 0 },
      discount: { currency: "INR", amount: 0 },
      platformFee: { currency: "INR", amount: 45 },
      total: { currency: "INR", amount: 2544 },
    },
    createdAt: "2026-02-02T09:45:00+05:30",
  },
];

export const registrationFlowSeed: RegistrationFlowState = {
  eventId: "coimbatore-marathon-2026",
  selectedCategoryId: "cat-10k-open",
  participant: {
    firstName: "Ananya",
    lastName: "Krishnan",
    email: "ananya.krishnan@example.test",
    phone: "+91 98765 10420",
    dateOfBirth: "1994-08-16",
    gender: "female",
    tshirtSize: "M",
    emergencyContactName: "Vikram Krishnan",
    emergencyContactPhone: "+91 98765 10421",
    medicalNotes: "No known allergies",
  },
  guardian: undefined,
  waiverAccepted: false,
  dpdpConsentAccepted: false,
  insurancePolicyId: "ins-reg-ananya-10k",
  couponCode: "EARLYCBE",
  orderSummary: {
    categoryFee: { currency: "INR", amount: 1499 },
    insurancePremium: { currency: "INR", amount: 149 },
    discount: { currency: "INR", amount: 200 },
    platformFee: { currency: "INR", amount: 35 },
    total: { currency: "INR", amount: 1483 },
  },
  paymentStatus: "not-started",
};

export const confirmedRegistration = participantRegistrations[0] as Registration;
export const pendingRegistration = participantRegistrations[1] as Registration;
