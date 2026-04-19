import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../config/api';
import { useCartActions, useCartState } from '../contexts/CartContext';

const Cart = () => {
  const { user } = useAuth();
  const { cart } = useCartState();
  const { fetchCart, removeFromCartSuccess, updateCartSuccess } = useCartActions();
  const token = localStorage.getItem("token");
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  const removeFromCart = async (id) => {
    const currentToken = localStorage.getItem("token");
    await fetch(buildApiUrl(`/cart/${id}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });
    await fetchCart();
    removeFromCartSuccess("Đã xóa sản phẩm");
  };

  const updateQuantity = async (id, change) => {
    const currentToken = localStorage.getItem("token");
    const item = cart.items.find((i) => i.id === id);
    if (!item) {
      return;
    }

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      return;
    }

    await fetch(buildApiUrl(`/cart/${id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ quantity: newQuantity })
    });
    await fetchCart();
    updateCartSuccess("Đã cập nhật số lượng");
  };

  const clearCart = async () => {
    const currentToken = localStorage.getItem("token");
    await fetch(buildApiUrl('/cart/clear'), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });
    await fetchCart();
    removeFromCartSuccess("Đã xóa toàn bộ giỏ hàng");
  };

  const totalAmount = cart?.totalPrice || 0;

  if (!token || !user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl">Vui lòng đăng nhập</h2>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
        <Link to="/books" className="text-blue-600 hover:underline">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-white p-4 rounded-lg shadow-sm items-center">
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-28 object-cover rounded"
              />
              <div className="flex-grow">
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-gray-500">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(item.unitPrice ?? 0)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item.id, -1)}>
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}>
                  <Plus size={16} />
                </button>
              </div>

              <button onClick={() => removeFromCart(item.id)}>
                <Trash2 size={20} className="text-red-500" />
              </button>
            </div>
          ))}

          <button onClick={clearCart} className="text-red-600">
            Xóa tất cả
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
          <h3 className="text-xl font-bold mb-4">Tổng cộng</h3>

          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(totalAmount)}
            </span>
          </div>

          <button
            onClick={() => alert("Thanh toán chưa làm")}
            className="w-full bg-blue-600 text-white py-3 rounded mt-6"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
