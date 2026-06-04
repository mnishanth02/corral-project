import type { InsurancePolicy } from "./types";

export const participantInsurancePolicies: InsurancePolicy[] = [
  {
    id: "ins-reg-ananya-10k",
    registrationId: "reg-ananya-10k-confirmed",
    providerName: "Corral Protect",
    planName: "Race Day Accident Cover",
    status: "issued",
    premium: { currency: "INR", amount: 149 },
    coverageAmount: { currency: "INR", amount: 100000 },
    issuedAt: "2026-01-12T10:35:00+05:30",
    claimSupportPhone: "+91 422 555 0198",
    summary: "Accidental medical cover for race day from reporting time until event closure.",
  },
  {
    id: "ins-reg-karthik-5k-selected",
    registrationId: "reg-karthik-5k-pending",
    providerName: "Corral Protect",
    planName: "Starter Cover",
    status: "selected",
    premium: { currency: "INR", amount: 99 },
    coverageAmount: { currency: "INR", amount: 50000 },
    claimSupportPhone: "+91 422 555 0198",
    summary: "Optional cover selected before payment confirmation.",
  },
];

export const defaultInsurancePolicy = participantInsurancePolicies[1];
