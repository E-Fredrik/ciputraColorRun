"use client";

import { useContext, useState, useEffect } from 'react';
import { CartContext } from '@/context/CartContext';
import CartItem from './CartItem';
import CartTotalPrice from './CartTotalPrice';
import ClearCartButton from './ClearCartButton';
import CheckoutButton from './CheckoutButton';
import '../styles/cart.css';
import { X } from 'lucide-react';

const ShoppingCart = () => {
  const { cart, isCartOpen, toggleCart } = useContext(CartContext);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {isCartOpen && <div onClick={toggleCart} className="fixed inset-0 bg-black opacity-50 z-40"></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-bold text-black">Shopping Cart</h3>
            <button onClick={toggleCart} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {isClient && cart.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Your cart is empty.</p>
            ) : (
              isClient && cart.map((item: any) => <CartItem key={item.id} item={item} />)
            )}
          </div>

          {isClient && cart.length > 0 && (
            <div className="p-4 border-t space-y-3">
              <CartTotalPrice />
              <CheckoutButton />
              <ClearCartButton />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShoppingCart;
