"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

const CartTotalPrice = () => {
  const { cart, discountMessages } = useContext(CartContext);

  const getTotalPrice = () => {
    return cart.reduce(
      (total: number, item: any) => {
        const basePrice = item.price * item.participants;
        const jerseyCharges = item.jerseyCharges || 0;
        return total + basePrice + jerseyCharges;
      },
      0
    );
  };

  const getTotalJerseyCharges = () => {
    return cart.reduce(
      (total: number, item: any) => total + (item.jerseyCharges || 0),
      0
    );
  };

  return (
    <div>
      {getTotalJerseyCharges() > 0 && (
        <div className="flex justify-between text-sm text-orange-600 mb-2">
          <span>Jersey Extra Charges:</span>
          <span>+Rp {getTotalJerseyCharges().toLocaleString("id-ID")}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-black">
        <span>Total:</span>
        <span>Rp {getTotalPrice().toLocaleString("id-ID")}</span>
      </div>
      <div className="text-red-500 text-sm mt-2">
        {discountMessages &&
          discountMessages.map((message: string, index: number) => (
            <p key={index}>{message}</p>
          ))}
      </div>
    </div>
  );
};

export default CartTotalPrice;