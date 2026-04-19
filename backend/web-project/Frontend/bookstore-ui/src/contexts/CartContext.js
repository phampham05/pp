import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import { buildApiUrl } from '../config/api';
import { toast } from 'react-toastify';

const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    totalQuantity: 0,
    totalPrice: 0
  });

  // BADGE = số loại sản phẩm
  // const cartItemCount = cart?.items?.length || 0;
  const cartItemCount =
    cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(buildApiUrl('/cart'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setCart(data.result);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải giỏ hàng");
    }
  }, []);

  // wrapper actions để show toast UI đồng nhất
  const addToCartSuccess = useCallback((msg = "Đã thêm vào giỏ hàng") => {
    toast.success(msg);
  }, []);

  const removeFromCartSuccess = useCallback((msg = "Đã xóa sản phẩm") => {
    toast.info(msg);
  }, []);

  const updateCartSuccess = useCallback((msg = "Đã cập nhật giỏ hàng") => {
    toast.success(msg);
  }, []);

  const stateValue = useMemo(() => ({
    cart,
    cartItemCount
  }), [cart, cartItemCount]);

  const actionsValue = useMemo(() => ({
    setCart,
    fetchCart,
    addToCartSuccess,
    removeFromCartSuccess,
    updateCartSuccess
  }), [
    fetchCart,
    addToCartSuccess,
    removeFromCartSuccess,
    updateCartSuccess
  ]);

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
};

export const useCartState = () => useContext(CartStateContext);
export const useCartActions = () => useContext(CartActionsContext);