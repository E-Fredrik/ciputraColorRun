"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

const CartItem = ({ item }: { item: any }) => {
  const { cart, setCart } = useContext(CartContext);

  const handleRemoveFromCart = (id: number) => {
    setCart(cart.filter((item: any) => item.id !== id));
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="font-semibold text-black">{item.categoryName}</p>
        <p className="text-sm text-gray-500">Participants: {item.participants}</p>
        <p className="text-sm text-gray-500">
          Price: Rp {item.price.toLocaleString("id-ID")}
        </p>
      </div>
      <button
        onClick={() => handleRemoveFromCart(item.id)}
        className="text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;