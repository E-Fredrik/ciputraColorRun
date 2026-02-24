"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

const ClearCartButton = () => {
  const { setCart } = useContext(CartContext);

  const handleClearCart = () => {
    setCart([]);
  };

  return (
    <button
      onClick={handleClearCart}
      className="text-gray-500 hover:text-gray-700"
    >
      Clear Cart
    </button>
  );
};

export default ClearCartButton;