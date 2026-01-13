"use client"
import { createContext, useState, ReactNode } from 'react';

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <CartContext.Provider value={{ cart, setCart, isCartOpen, toggleCart }}>
      {children}
    </CartContext.Provider>
  );
};
