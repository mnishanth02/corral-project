import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type StickyCtaContextValue = {
  cta: ReactNode;
  setCta: (node: ReactNode) => void;
  inputFocused: boolean;
};

const StickyCtaContext = createContext<StickyCtaContextValue | undefined>(undefined);

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export type StickyCtaProviderProps = {
  children: ReactNode;
};

export function StickyCtaProvider({ children }: StickyCtaProviderProps) {
  const [cta, setCta] = useState<ReactNode>(null);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    function handleFocusIn(event: FocusEvent) {
      setInputFocused(isEditableElement(event.target));
    }

    function handleFocusOut() {
      window.setTimeout(() => setInputFocused(isEditableElement(document.activeElement)), 0);
    }

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const value = useMemo(
    () => ({
      cta,
      setCta,
      inputFocused,
    }),
    [cta, inputFocused],
  );

  return <StickyCtaContext.Provider value={value}>{children}</StickyCtaContext.Provider>;
}

function useStickyCtaContext() {
  const context = useContext(StickyCtaContext);

  if (!context) {
    throw new Error("useStickyCta must be used within StickyCtaProvider");
  }

  return context;
}

export function useStickyCta(node: ReactNode) {
  const { setCta } = useStickyCtaContext();

  useEffect(() => {
    setCta(node);

    return () => {
      setCta(null);
    };
  }, [node, setCta]);
}

export function useStickyCtaSlot() {
  const { cta, inputFocused } = useStickyCtaContext();

  return { cta, hasCta: Boolean(cta), inputFocused };
}
