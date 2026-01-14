"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { CartContext } from "@/context/CartContext";
import { showToast } from "@/lib/toast";

const CheckoutButton = () => {
  const { cart } = useContext(CartContext);
  const router = useRouter();

  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

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

    // Save cart items to session storage for the confirm payment page
    const cartData = {
      type: "cart",
      items: cart.map((item) => ({
        ...item,
        categoryId: item.categoryId, // Ensure categoryId is included
      })),
    };
    sessionStorage.setItem("currentRegistration", JSON.stringify(cartData));

    // Redirect to confirmation page
    router.push("/registration/confirm");
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