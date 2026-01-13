"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

const CartTotalPrice = () => {
  const { cart } = useContext(CartContext);

  const getTotalPrice = () => {
    return cart.reduce(
      (total: number, item: any) =>
        total + item.price * item.participants + item.jerseyCharges,
      0
    );
  };

  return (
    <div className="flex justify-between font-bold">
      <span>Total:</span>
      <span>Rp {getTotalPrice().toLocaleString("id-ID")}</span>
    </div>
  );
};

export default CartTotalPrice;