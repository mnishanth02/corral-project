import React from "react";

import { activeParticipantCoupon } from "./coupons";
import { registrationFlowSeed } from "./registrations";
import type {
  GuardianData,
  InsurancePolicy,
  ParticipantFormData,
  PaymentStatus,
  RegistrationFlowState,
} from "./types";

const storageKey = "corral-web-registration-flow";

type RegistrationFlowActions = {
  setSelectedCategory: (categoryId: string) => void;
  updateParticipant: (participant: Partial<ParticipantFormData>) => void;
  setGuardian: (guardian: GuardianData | undefined) => void;
  setWaiverAccepted: (accepted: boolean) => void;
  setDpdpConsentAccepted: (accepted: boolean) => void;
  setInsurance: (policy: InsurancePolicy | undefined) => void;
  applyCoupon: (couponCode: string | undefined) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  resetFlow: () => void;
};

export type RegistrationFlowContextValue = RegistrationFlowState & RegistrationFlowActions;

export type RegistrationFlowProviderProps = {
  children: React.ReactNode;
  initialState?: RegistrationFlowState;
  persist?: boolean;
  localStorageKey?: string;
};

type FlowAction =
  | { type: "set-category"; categoryId: string }
  | { type: "update-participant"; participant: Partial<ParticipantFormData> }
  | { type: "set-guardian"; guardian: GuardianData | undefined }
  | { type: "set-waiver"; accepted: boolean }
  | { type: "set-dpdp"; accepted: boolean }
  | { type: "set-insurance"; policy: InsurancePolicy | undefined }
  | { type: "apply-coupon"; couponCode: string | undefined }
  | { type: "set-payment-status"; status: PaymentStatus }
  | { type: "reset"; state: RegistrationFlowState };

const RegistrationFlowContext = React.createContext<RegistrationFlowContextValue | undefined>(
  undefined,
);

function readStoredState(key: string): RegistrationFlowState | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as RegistrationFlowState;
  } catch {
    window.localStorage.removeItem(key);
    return undefined;
  }
}

function reducer(state: RegistrationFlowState, action: FlowAction): RegistrationFlowState {
  switch (action.type) {
    case "set-category":
      return { ...state, selectedCategoryId: action.categoryId };
    case "update-participant":
      return { ...state, participant: { ...state.participant, ...action.participant } };
    case "set-guardian":
      return { ...state, guardian: action.guardian };
    case "set-waiver":
      return { ...state, waiverAccepted: action.accepted };
    case "set-dpdp":
      return { ...state, dpdpConsentAccepted: action.accepted };
    case "set-insurance":
      return {
        ...state,
        insurancePolicyId: action.policy?.id,
        orderSummary: {
          ...state.orderSummary,
          insurancePremium: action.policy?.premium ?? { currency: "INR", amount: 0 },
          total: {
            currency: "INR",
            amount:
              state.orderSummary.categoryFee.amount +
              (action.policy?.premium.amount ?? 0) +
              state.orderSummary.platformFee.amount -
              state.orderSummary.discount.amount,
          },
        },
      };
    case "apply-coupon": {
      const discountAmount = action.couponCode === activeParticipantCoupon.code ? 200 : 0;

      return {
        ...state,
        couponCode: action.couponCode,
        orderSummary: {
          ...state.orderSummary,
          discount: { currency: "INR", amount: discountAmount },
          total: {
            currency: "INR",
            amount:
              state.orderSummary.categoryFee.amount +
              state.orderSummary.insurancePremium.amount +
              state.orderSummary.platformFee.amount -
              discountAmount,
          },
        },
      };
    }
    case "set-payment-status":
      return { ...state, paymentStatus: action.status };
    case "reset":
      return action.state;
  }
}

export function RegistrationFlowProvider({
  children,
  initialState = registrationFlowSeed,
  persist = true,
  localStorageKey = storageKey,
}: RegistrationFlowProviderProps) {
  const [state, dispatch] = React.useReducer(
    reducer,
    initialState,
    (seed) => readStoredState(localStorageKey) ?? seed,
  );

  React.useEffect(() => {
    if (persist && typeof window !== "undefined") {
      window.localStorage.setItem(localStorageKey, JSON.stringify(state));
    }
  }, [localStorageKey, persist, state]);

  const value = React.useMemo<RegistrationFlowContextValue>(
    () => ({
      ...state,
      setSelectedCategory: (categoryId) => dispatch({ type: "set-category", categoryId }),
      updateParticipant: (participant) => dispatch({ type: "update-participant", participant }),
      setGuardian: (guardian) => dispatch({ type: "set-guardian", guardian }),
      setWaiverAccepted: (accepted) => dispatch({ type: "set-waiver", accepted }),
      setDpdpConsentAccepted: (accepted) => dispatch({ type: "set-dpdp", accepted }),
      setInsurance: (policy) => dispatch({ type: "set-insurance", policy }),
      applyCoupon: (couponCode) => dispatch({ type: "apply-coupon", couponCode }),
      setPaymentStatus: (status) => dispatch({ type: "set-payment-status", status }),
      resetFlow: () => dispatch({ type: "reset", state: initialState }),
    }),
    [initialState, state],
  );

  return React.createElement(RegistrationFlowContext.Provider, { value }, children);
}

export function useRegistrationFlow(): RegistrationFlowContextValue {
  const context = React.useContext(RegistrationFlowContext);

  if (!context) {
    throw new Error("useRegistrationFlow must be used within RegistrationFlowProvider");
  }

  return context;
}
