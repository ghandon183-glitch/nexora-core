"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface Purchase {
  slug: string;
  title: string;
  price: number;
  purchasedAt: string;
}

interface PurchasesContextValue {
  purchases: Purchase[];
  hasPurchased: (slug: string) => boolean;
  addPurchase: (purchase: Omit<Purchase, "purchasedAt">) => void;
}

const STORAGE_KEY = "nexora_purchases";

const PurchasesContext = createContext<PurchasesContextValue | undefined>(
  undefined
);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount, not a synchronization loop
        setPurchases(JSON.parse(stored));
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  function hasPurchased(slug: string) {
    return purchases.some((purchase) => purchase.slug === slug);
  }

  function addPurchase(purchase: Omit<Purchase, "purchasedAt">) {
    setPurchases((current) => {
      if (current.some((item) => item.slug === purchase.slug)) {
        return current;
      }

      const next = [
        ...current,
        { ...purchase, purchasedAt: new Date().toISOString() },
      ];

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures
      }

      return next;
    });
  }

  return (
    <PurchasesContext.Provider
      value={{ purchases, hasPurchased, addPurchase }}
    >
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);

  if (!context) {
    throw new Error("usePurchases must be used within a PurchasesProvider");
  }

  return context;
}
