"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";
import { showToast } from "@/lib/toast";

const CheckoutButton = () => {
  const { cart } = useContext(CartContext);

  const handleCheckout = () => {
    const communityItems = cart.filter((item) => item.type === "community");
    if (communityItems.length > 0) {
      const totalCommunityParticipants = communityItems.reduce(
        (total, item) => total + (item.participants as number),
        0
      );
      if (totalCommunityParticipants < 10) {
        showToast(
          "Community registration requires a minimum of 10 participants.",
          "error"
        );
        return;
      }
    }

    // Implement checkout logic here
    alert("Redirecting to checkout...");
  };

  return (
    <button
      onClick={handleCheckout}
      className="w-full bg-green-500 text-white py-2 rounded-lg mt-4 hover:bg-green-600 transition-colors"
    >
      Buy Now
    </button>
  );
};

export default CheckoutButton;