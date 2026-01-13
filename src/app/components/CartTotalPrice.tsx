"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

const CartTotalPrice = () => {
  const { cart, discountMessages } = useContext(CartContext);

  const getTotalPrice = () => {
    return cart.reduce(
      (total: number, item: any) =>
        total + item.price * item.participants + item.jerseyCharges,
      0
    );
  };

  return (
    <div>
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