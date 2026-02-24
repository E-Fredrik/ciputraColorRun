"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";

const CartItem = ({ item }: { item: any }) => {
  const { cart, setCart } = useContext(CartContext);

  const handleRemoveFromCart = (id: number) => {
    setCart(cart.filter((item: any) => item.id !== id));
  };

  // Calculate total price including jersey charges
  const totalItemPrice = (item.price * item.participants) + (item.jerseyCharges || 0);

  return (
    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
      <div className="flex-1">
        <p className="font-semibold text-black">{item.categoryName}</p>
        <p className="text-sm text-gray-500">Participants: {item.participants}</p>
        <p className="text-sm text-gray-500">
          Base Price: Rp {(item.price * item.participants).toLocaleString("id-ID")}
        </p>
        {item.jerseyCharges > 0 && (
          <p className="text-sm text-orange-600">
            Jersey Charges: +Rp {item.jerseyCharges.toLocaleString("id-ID")}
          </p>
        )}
        <p className="text-sm font-semibold text-emerald-700 mt-1">
          Total: Rp {totalItemPrice.toLocaleString("id-ID")}
        </p>
        {item.jerseys && Object.keys(item.jerseys).length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-semibold text-gray-600">Jerseys:</p>
            <ul className="list-disc list-inside text-sm text-gray-500">
              {Object.entries(item.jerseys).map(([size, quantity]) =>
                quantity ? (
                  <li key={size}>
                    {size}: {String(quantity)}
                    {/* Show extra charge indicator */}
                    {(size === "XXL" || size === "3L" || size === "4L" || size === "5L") && (
                      <span className="text-orange-500 ml-1">(+10k each)</span>
                    )}
                    {size === "6L" && (
                      <span className="text-red-500 ml-1">(+20k each)</span>
                    )}
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
      </div>
      <button
        onClick={() => handleRemoveFromCart(item.id)}
        className="text-red-500 hover:text-red-700 ml-4"
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;