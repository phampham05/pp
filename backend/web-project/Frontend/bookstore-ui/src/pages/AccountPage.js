import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, LogOut, Edit2, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl, resolveAvatarUrl, DEFAULT_AVATAR_URL } from '../config/api';
import { toast } from 'react-toastify';

const PHONE_REGEX = /^0\d{9}$/;

const AccountPage = () => {
  const [errors, setErrors] = useState({});
  const inputRefs = {
    currentPassword: React.useRef(null),
    newPassword: React.useRef(null),
    confirmPassword: React.useRef(null),
  };
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isPhoneInvalid = form.phone && !PHONE_REGEX.test(form.phone);

  const [pwd, setPwd] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);


  const validatePasswordForm = () => {
    const newErrors = {};
  
    if (!pwd.currentPassword) {
      newErrors.currentPassword = "Không được để trống";
    }
  
    if (!pwd.newPassword) {
      newErrors.newPassword = "Không được để trống";
    } else if (pwd.newPassword.length < 6) {
      newErrors.newPassword = "Phải >= 6 ký tự";
    }
  
    if (!pwd.confirmPassword) {
      newErrors.confirmPassword = "Không được để trống";
    } else if (pwd.confirmPassword !== pwd.newPassword) {
      newErrors.confirmPassword = "Không khớp";
    }
  
    if (pwd.newPassword === pwd.currentPassword) {
      newErrors.newPassword = "Không được trùng mật khẩu cũ";
    }
  
    setErrors(newErrors);
  
    // focus vào field đầu tiên lỗi
    const firstErrorField = Object.keys(newErrors)[0];
    if (firstErrorField && inputRefs[firstErrorField]?.current) {
      inputRefs[firstErrorField].current.focus();
    }
  
    return Object.keys(newErrors).length === 0;
  };


  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(buildApiUrl('/users/my-info'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Load thất bại");
      }

      const userData = data.result;

      setProfile(userData);

      // sync form với server
      setForm({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);


  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [user, authLoading, fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
  
    if (!form.phone || form.phone.trim() === '') {
      toast.error("Số điện thoại là bắt buộc");
      return;
    }
  
    if (!PHONE_REGEX.test(form.phone)) {
      toast.error("SĐT phải 10 số và bắt đầu bằng 0");
      return;
    }
  
    try {
      setSaving(true);
  
      const res = await fetch(buildApiUrl('/users/me'), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật thất bại");
      }
  
      const updated = data.result;
  
      setProfile(updated);
      setForm({
        fullName: updated.fullName || '',
        phone: updated.phone || '',
        address: updated.address || ''
      });
  
      setIsEditing(false);
  
      toast.success("Cập nhật thành công");
  
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
  
    // validate trước
    if (!validatePasswordForm()) return;
  
    try {
      setChangingPwd(true);
  
      const res = await fetch(buildApiUrl('/auth/change-password'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: pwd.currentPassword,
          newPassword: pwd.newPassword
        })
      });
  
      const data = await res.json().catch(() => null);
  
      if (!res.ok) {
        const errorCode = data?.code;
        const backendMsg = data?.message || "";

        // password sai
        if (errorCode === 1023 || backendMsg.toLowerCase().includes("invalid current password")) {
          setErrors({ currentPassword: "Mật khẩu hiện tại không đúng" });
          inputRefs.currentPassword.current?.focus();
          return;
        }

        // token hết hạn
        if (res.status === 401) {
          toast.error("Phiên đăng nhập hết hạn");
          return;
        }
  
        throw new Error(backendMsg || "Đổi mật khẩu thất bại");
      }
  
      toast.success("Đổi mật khẩu thành công");
  
      setPwd({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
  
      setErrors({});
      setShowPwdForm(false);
  
    } catch (err) {
      toast.error(err.message || "Lỗi server");
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.info("Đã đăng xuất");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Không tìm thấy dữ liệu người dùng
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <User className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-gray-800">
            Tài khoản
          </h1>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-md p-6">

          {/* AVATAR */}
          <div className="text-center mb-6">
            <img
              src={resolveAvatarUrl(profile.avatar || user.avatar)}
              className="w-24 h-24 mx-auto rounded-full object-cover border"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR_URL;
              }}
            />

            <h2 className="mt-3 font-semibold text-lg">
              {profile.fullName}
            </h2>

            <p className="text-gray-500 text-sm">
              {profile.email}
            </p>
          </div>

          {/* EDIT MODE */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">

              <input
                value={form.fullName}
                onChange={(e) =>
                  setForm(prev => ({ ...prev, fullName: e.target.value }))
                }
                className="w-full border p-2 rounded-lg"
                placeholder="Họ tên"
              />

              <div>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                  className={`w-full border p-2 rounded-lg ${
                    isPhoneInvalid ? 'border-red-500' : ''
                  }`}
                  placeholder="Số điện thoại"
                />

                {isPhoneInvalid && (
                  <p className="text-red-500 text-xs mt-1">
                    SĐT phải 10 số và bắt đầu bằng 0
                  </p>
                )}
              </div>

              <input
                value={form.address}
                onChange={(e) =>
                  setForm(prev => ({ ...prev, address: e.target.value }))
                }
                className="w-full border p-2 rounded-lg"
                placeholder="Địa chỉ"
              />

              <div className="flex gap-2">
                <button
                  disabled={saving || !form.phone ||
                    form.phone.trim() === '' ||
                    !PHONE_REGEX.test(form.phone)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg"
                >
                  Hủy
                </button>
              </div>

            </form>
          ) : (
            <div className="space-y-4">

              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{profile.phone || "Chưa có"}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{profile.address || "Chưa có"}</span>
              </div>

              <hr />

              <button
                onClick={() => setIsEditing(true)}
                className="w-full border py-2 rounded-lg"
              >
                <Edit2 size={16} className="inline mr-2" />
                Chỉnh sửa
              </button>

              <hr className="my-4" />

              <button
                onClick={() => setShowPwdForm(!showPwdForm)}
                className="w-full border py-2 rounded-lg mb-3"
              >
                Đổi mật khẩu
              </button>

              {showPwdForm && (
                <form onSubmit={handleChangePassword} className="space-y-3">

                  <div>
                    <input
                      ref={inputRefs.currentPassword}
                      type="password"
                      value={pwd.currentPassword}
                      onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                      className={`w-full border p-2 rounded-lg ${
                        errors.currentPassword ? "border-red-500" : ""
                      }`}
                      placeholder="Mật khẩu hiện tại"
                    />

                    {errors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      ref={inputRefs.newPassword}
                      type="password"
                      value={pwd.newPassword}
                      onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                      className={`w-full border p-2 rounded-lg ${
                        errors.newPassword ? "border-red-500" : ""
                      }`}
                      placeholder="Mật khẩu mới"
                    />

                    {errors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      ref={inputRefs.confirmPassword}
                      type="password"
                      value={pwd.confirmPassword}
                      onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                      className={`w-full border p-2 rounded-lg ${
                        errors.confirmPassword ? "border-red-500" : ""
                      }`}
                      placeholder="Xác nhận mật khẩu"
                    />

                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    disabled={changingPwd}
                    className="w-full bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    {changingPwd ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                  </button>
                </form>
              )}

              <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 py-2 rounded-lg"
              >
                <LogOut size={16} className="inline mr-2" />
                Đăng xuất
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AccountPage;
