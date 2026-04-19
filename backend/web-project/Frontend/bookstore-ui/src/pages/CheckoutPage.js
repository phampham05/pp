import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.fullName || user?.name || '';
  const displayEmail = user?.email || '';
  const [form, setForm] = useState({
    name: displayName,
    email: displayEmail,
    phone: '',
    address: '',
    paymentMethod: 'COD'
  });

  const items = state?.items || [];
  const totalPrice = state?.totalPrice || 0;
  const total = items.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * i.quantity,
    0
  );

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // VN address API
  const [suggestions, setSuggestions] = useState([]);
  const [timeoutId, setTimeoutId] = useState(null);

  const searchAddress = (text) => {
    setForm(prev => ({ ...prev, address: text }));
  
    if (timeoutId) clearTimeout(timeoutId);
  
    const id = setTimeout(async () => {
      if (text.length < 3) return setSuggestions([]);
  
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${text}, Vietnam`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {}
    }, 300);
  
    setTimeoutId(id);
  };

  const selectAddress = (a) => {
    setForm(prev => ({ ...prev, address: a.display_name }));
    setSuggestions([]);
  };

  const validateStep1 = () => {
    if (user) return true;

    const err = {};
  
    if (!form.name.trim()) err.name = "Tên không được để trống";
  
    if (!form.email.trim()) err.email = "Email không được để trống";
    else if (!EMAIL_REGEX.test(form.email)) err.email = "Email không hợp lệ";
  
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  
  const validateStep2 = () => {
    const err = {};
  
    if (!form.phone.trim()) err.phone = "SĐT không được để trống";
    else if (!PHONE_REGEX.test(form.phone))
      err.phone = "SĐT phải 10 số và bắt đầu bằng 0";
  
    if (!form.address.trim()) err.address = "Địa chỉ không được để trống";
  
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const createOrder = async () => {
    try {
      setLoading(true);
  
      const token = localStorage.getItem("token");
  
      const res = await fetch(buildApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          phone: form.phone,
          address: form.address,
          paymentMethod: form.paymentMethod
        })
      });
  
      const data = await res.json();
  
      if (!res.ok) throw new Error(data?.message || "Tạo đơn thất bại");
  
      return data.result;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;
  
    const order = await createOrder();
    if (!order) return;
  
    if (form.paymentMethod === 'VNPay') {
      navigate('/vnpay-gateway', {
        state: { orderId: order.orderId }
      });
      return;
    }
  
    toast.success("Đặt hàng thành công");
    navigate('/account');
  };

  if (!items.length) {
    return <div className="p-10 text-center">Không có sản phẩm</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
  
      {/* HEADER */}
      <h1 className="text-2xl font-bold">Thanh toán</h1>
  
      {/* USER INFO */}
      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <h2 className="font-semibold">Thông tin người đặt</h2>
  
        {user ? (
          <div className="text-sm text-gray-600 space-y-1">
            <p><b>Họ tên:</b> {user.fullName}</p>
            <p><b>Email:</b> {user.email}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Họ tên"
              className={`w-full border p-2 rounded ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
  
            <input
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className={`w-full border p-2 rounded ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>
        )}
      </div>
  
      {/* PHONE */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="font-semibold">Số điện thoại</label>
        <input
          value={form.phone}
          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="0xxxxxxxxx"
          className={`w-full mt-2 border p-2 rounded ${errors.phone ? 'border-red-500' : ''}`}
        />
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
        )}
      </div>
  
      {/* ADDRESS */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="font-semibold">Địa chỉ giao hàng</label>
        <input
          value={form.address}
          onChange={(e) => searchAddress(e.target.value)}
          placeholder="Nhập địa chỉ..."
          className={`w-full mt-2 border p-2 rounded ${errors.address ? 'border-red-500' : ''}`}
        />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1">{errors.address}</p>
        )}

        {suggestions.length > 0 && (
            <div className="border mt-2 rounded bg-white shadow">
                {suggestions.map((a) => (
                <div
                    key={a.place_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => selectAddress(a)}
                >
                    {a.display_name}
                </div>
                ))}
            </div>
        )}
      </div>
  
      {/* GOOGLE MAP SUGGEST (placeholder UI) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Gợi ý địa chỉ (VN)</h2>
        <p className="text-xs text-gray-500">
          (Tích hợp API gợi ý địa chỉ Việt Nam sẽ hiển thị tại đây)
        </p>
      </div>
  
      {/* ITEMS */}
      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <h2 className="font-semibold">Sản phẩm</h2>
  
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm border-b pb-2">
            <span>{item.title} x {item.quantity}</span>
            <span>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>
  
      {/* PAYMENT METHOD */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Phương thức thanh toán</h2>
  
        <select
            value={form.paymentMethod}
            onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full border p-2 rounded"
            >
            <option value="COD">Thanh toán khi nhận hàng (COD)</option>
            <option value="ONLINE">VNPay (Fake Gateway)</option>
        </select>
      </div>
  
      {/* TOTAL */}
      <div className="bg-white p-4 rounded-lg shadow flex justify-between font-bold">
        <span>Tổng thanh toán</span>
        <span className="text-red-600">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(total)}
        </span>
      </div>
  
      {/* ACTION */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {form.paymentMethod === 'ONLINE'
          ? 'Thanh toán qua VNPay'
          : 'Đặt hàng'}
      </button>
  
    </div>
  );
};

export default CheckoutPage;