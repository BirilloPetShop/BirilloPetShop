
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem, Product, ProductVariant } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, variantId: number | undefined, newQuantity: number) => void;
  updateServiceDetails: (productId: number, date: string, notes: string) => void;
  clearCart: () => void;
  total: number;
  totalSavings: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children?: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('aquapet_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('aquapet_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = useCallback((product: Product, quantity = 1, variant?: ProductVariant) => {
    setItems(prev => {
      // Check for existing item matching Product ID AND Variant ID (if applicable)
      const existingIndex = prev.findIndex(item => {
        const sameProduct = item.id === product.id;
        const sameVariant = item.selectedVariant?.id === variant?.id;
        return sameProduct && sameVariant;
      });

      if (existingIndex >= 0) {
        // Update quantity of existing line item
        const newItems = [...prev];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      }

      // Add new line item
      return [...prev, { ...product, quantity, selectedVariant: variant }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: number, variantId?: number) => {
    setItems(prev => prev.filter(item => {
      // Keep item if ID is different OR if variant ID is different
      const sameProduct = item.id === productId;
      const sameVariant = item.selectedVariant?.id === variantId;

      // Remove only if BOTH match
      return !(sameProduct && sameVariant);
    }));
  }, []);

  const updateQuantity = useCallback((productId: number, variantId: number | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems(prev => prev.map(item => {
      const sameProduct = item.id === productId;
      const sameVariant = item.selectedVariant?.id === variantId;
      if (sameProduct && sameVariant) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  }, [removeFromCart]);

  const updateServiceDetails = useCallback((productId: number, date: string, notes: string) => {
    setItems(prev => prev.map(item =>
      item.id === productId ? { ...item, serviceDate: date, serviceNotes: notes } : item
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // Calculate Total handling Discounts
  const total = items.reduce((sum, item) => {
    let price: number;
    if (item.selectedVariant) {
      price = item.selectedVariant.prezzo_scontato || item.selectedVariant.prezzo;
    } else {
      price = item.attributes.prezzo_scontato || item.attributes.prezzo;
    }
    return sum + (price * item.quantity);
  }, 0);

  // Calculate Total Savings
  const totalSavings = items.reduce((sum, item) => {
    if (item.selectedVariant) {
      if (item.selectedVariant.prezzo_scontato && item.selectedVariant.prezzo_scontato < item.selectedVariant.prezzo) {
        return sum + ((item.selectedVariant.prezzo - item.selectedVariant.prezzo_scontato) * item.quantity);
      }
    } else if (item.attributes.prezzo_scontato && item.attributes.prezzo_scontato < item.attributes.prezzo) {
      return sum + ((item.attributes.prezzo - item.attributes.prezzo_scontato) * item.quantity);
    }
    return sum;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, updateServiceDetails, clearCart,
      total, totalSavings, itemCount, isCartOpen, setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
