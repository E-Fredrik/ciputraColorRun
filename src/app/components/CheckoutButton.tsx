"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { CartContext } from "@/context/CartContext";
import { showToast } from "@/lib/toast";

interface CheckoutButtonProps {
  onCheckout?: () => void; // callback to close cart modal
}

const CheckoutButton = ({ onCheckout }: CheckoutButtonProps) => {
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
        (total, item) => total + Number(item.participants || 0),
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

    // Load user details from session storage
    const userDetails = {
      fullName: sessionStorage.getItem("reg_fullName") || "",
      email: sessionStorage.getItem("reg_email") || "",
      phone: sessionStorage.getItem("reg_phone") || "",
      emergencyPhone: sessionStorage.getItem("reg_emergencyPhone") || "",
      birthDate: sessionStorage.getItem("reg_birthDate") || "",
      gender: sessionStorage.getItem("reg_gender") || "male",
      currentAddress: sessionStorage.getItem("reg_currentAddress") || "",
      nationality: sessionStorage.getItem("reg_nationality") || "WNI",
      medicalHistory: sessionStorage.getItem("reg_medicalHistory") || "",
      medicationAllergy: sessionStorage.getItem("reg_medicationAllergy") || "",
      existingIdCardPhotoUrl: sessionStorage.getItem("reg_existingIdCardPhotoUrl") || "",
      registrationType: "cart",
      groupName: sessionStorage.getItem("reg_groupName") || "",
    };

    // Build cart registration data with proper structure
    const cartRegistrationData = {
      type: "cart",
      items: cart.map((item) => ({
        id: item.id,
        type: item.type,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        participants: Number(item.participants || 1),
        price: Number(item.price || 0),
        jerseyCharges: Number(item.jerseyCharges || 0),
        jerseys: item.jerseys || {},
        jerseySize: item.jerseySize || null,
        groupName: item.groupName || userDetails.groupName || "",
      })),
      userDetails,
    };

    // Save to session storage
    sessionStorage.setItem("currentRegistration", JSON.stringify(cartRegistrationData));

    // Close the cart modal BEFORE redirecting
    if (onCheckout) {
      onCheckout();
    }

    // Small delay to allow modal close animation to complete
    setTimeout(() => {
      router.push("/registration/confirm");
    }, 100);
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