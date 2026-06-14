import { useReducer } from 'react';
export interface CartItem {
  productId: string; modelName: string; imageUrl?: string | null;
  mrp: number; nlc: number; quantity: number; availableQty: number;
}
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QTY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.productId === action.payload.productId);
      if (existing) return state.map((i) => i.productId === action.payload.productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...state, { ...action.payload, quantity: 1 }];
    }
    case 'UPDATE_QTY':
      if (action.payload.quantity <= 0) return state.filter((i) => i.productId !== action.payload.productId);
      return state.map((i) => i.productId === action.payload.productId ? { ...i, quantity: action.payload.quantity } : i);
    case 'REMOVE_ITEM': return state.filter((i) => i.productId !== action.payload.productId);
    case 'CLEAR_CART': return [];
    default: return state;
  }
}

export function useCart() {
  const [items, dispatch] = useReducer(cartReducer, []);
  const addItem = (p: Omit<CartItem, 'quantity'>) => dispatch({ type: 'ADD_ITEM', payload: p });
  const removeItem = (productId: string) => dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  const updateQty = (productId: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', payload: { productId, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const total = items.reduce((sum, i) => sum + i.nlc * i.quantity, 0);
  return { items, addItem, removeItem, updateQty, clearCart, total };
}
