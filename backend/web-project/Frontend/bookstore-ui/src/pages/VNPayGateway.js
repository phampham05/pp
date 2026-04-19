import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VNPayGateway = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/account');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-10 text-center">
      <h1>Đang xử lý VNPay...</h1>
      <p>Không tắt trình duyệt</p>
    </div>
  );
};

export default VNPayGateway;