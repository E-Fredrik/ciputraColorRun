"use client";
import { createContext, useState, useEffect, ReactNode } from "react";
import { showToast } from "@/lib/toast";

export const CartContext = createContext<any>(null);

interface Category {
  id: number;
  name: string;
  basePrice: string;
  earlyBirdPrice?: string;
  tier1Price?: string;
  tier1Min?: number;
  tier1Max?: number;
  tier2Price?: string;
  tier2Min?: number;
  tier2Max?: number | null;
  tier3Price?: string;
  tier3Min?: number;
  bundlePrice?: string;
  bundleSize?: number;
  earlyBirdCapacity?: number;
  earlyBirdRemaining?: number | null;
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<any[]>(() => {
    try {
      const savedCart = sessionStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from sessionStorage", error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/categories`, {
          cache: "no-store",
          headers: { "Cache-control": "no-cache" },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Error response from /api/categories:", errorData);
          throw new Error(
            `Failed to load categories. Status: ${res.status}. Details: ${
              errorData.details || "No details"
            }`
          );
        }
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
        showToast("Failed to load categories. Please refresh the page.", "error");
      }
    })();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to sessionStorage", error);
    }
  }, [cart]);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const updateCart = (newCart: any[]) => {
    const communityItems = newCart.filter((item) => item.type === "community");
    const totalCommunityParticipants = communityItems.reduce(
      (total, item) => total + (item.participants as number),
      0
    );

    const updatedCart = newCart.map((item) => {
      if (item.type === "community") {
        const category = categories.find((c) => c.name === item.categoryName);
        if (category) {
          let newPrice = Number(category.basePrice);
          if (
            category.tier3Price &&
            category.tier3Min &&
            totalCommunityParticipants >= category.tier3Min
          ) {
            newPrice = Number(category.tier3Price);
          } else if (
            category.tier2Price &&
            category.tier2Min &&
            category.tier2Max &&
            totalCommunityParticipants >= category.tier2Min &&
            totalCommunityParticipants <= category.tier2Max
          ) {
            newPrice = Number(category.tier2Price);
          } else if (
            category.tier1Price &&
            category.tier1Min &&
            category.tier1Max &&
            totalCommunityParticipants >= category.tier1Min &&
            totalCommunityParticipants <= category.tier1Max
          ) {
            newPrice = Number(category.tier1Price);
          }
          return { ...item, price: newPrice };
        }
      }
      return item;
    });
    setCart(updatedCart);
  };

  return (
    <CartContext.Provider
      value={{ cart, setCart: updateCart, isCartOpen, toggleCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
