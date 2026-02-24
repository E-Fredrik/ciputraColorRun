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
  const [discountMessages, setDiscountMessages] = useState<string[]>([]);

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

    const communityItems = cart.filter((item) => item.type === "community");
    const messages: string[] = [];
    
    if (communityItems.length > 0 && categories.length > 0) {
      const totalCommunityParticipants = communityItems.reduce(
        (total, item) => total + (item.participants as number),
        0
      );

      const updatedCart = [...cart];
      let tierApplied = false;

      updatedCart.forEach((item, index) => {
        if (item.type === "community") {
          const category = categories.find((c) => c.name === item.categoryName);
          if (category) {
            let newPrice = Number(category.basePrice);
            console.log(`[DEBUG] Initial price for ${item.categoryName}: ${newPrice}`);
            console.log(`[DEBUG] Total community participants: ${totalCommunityParticipants}`);
            console.log(`[DEBUG] Category tiers: Tier1(${category.tier1Min}-${category.tier1Max}) Price: ${category.tier1Price}, Tier2(${category.tier2Min}-${category.tier2Max}) Price: ${category.tier2Price}, Tier3(${category.tier3Min}) Price: ${category.tier3Price}`);

            if (category.tier3Price && category.tier3Min && totalCommunityParticipants >= category.tier3Min) {
              newPrice = Number(category.tier3Price);
              console.log(`[DEBUG] Applied Tier 3 price: ${newPrice}`);
            } else {
              // normalize optional max values to number | null to avoid TS error
              const t2Max = typeof category.tier2Max === "number" ? category.tier2Max : null;
              const t1Max = typeof category.tier1Max === "number" ? category.tier1Max : null;

              if (category.tier2Price && category.tier2Min && totalCommunityParticipants >= category.tier2Min && (t2Max === null || totalCommunityParticipants <= t2Max)) {
                newPrice = Number(category.tier2Price);
                console.log(`[DEBUG] Applied Tier 2 price: ${newPrice}`);
              } else if (category.tier1Price && category.tier1Min && totalCommunityParticipants >= category.tier1Min && (t1Max === null || totalCommunityParticipants <= t1Max)) {
                newPrice = Number(category.tier1Price);
                console.log(`[DEBUG] Applied Tier 1 price: ${newPrice}`);
              }
            }
            updatedCart[index] = { ...item, price: newPrice };
            console.log(`[DEBUG] Item ${item.categoryName} updated price in cart: ${updatedCart[index].price}`);

            if (!tierApplied) {
              if (category.tier1Min && totalCommunityParticipants < category.tier1Min) {
                messages.push(`Add ${category.tier1Min - totalCommunityParticipants} more people to get Tier 1 pricing!`);
              } else if (category.tier2Min && totalCommunityParticipants < category.tier2Min) {
                messages.push(`Add ${category.tier2Min - totalCommunityParticipants} more people to get Tier 2 pricing!`);
              } else if (category.tier3Min && totalCommunityParticipants < category.tier3Min) {
                messages.push(`Add ${category.tier3Min - totalCommunityParticipants} more people to get Tier 3 pricing!`);
              }
              tierApplied = true;
            }
          }
        }
      });
      
      setDiscountMessages(messages);
      
      // Only update cart if prices have actually changed to prevent infinite loops
      if (JSON.stringify(updatedCart) !== JSON.stringify(cart)) {
        setCart(updatedCart);
      }
    } else {
      setDiscountMessages([]);
    }
  }, [cart, categories]);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  // Add a method to clear cart
  const clearCart = () => {
    setCart([]);
    sessionStorage.removeItem("cart");
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      setCart, 
      clearCart, // Export clearCart function
      isCartOpen, 
      setIsCartOpen, 
      toggleCart, 
      categories, 
      discountMessages 
    }}>
      {children}
    </CartContext.Provider>
  );
};
