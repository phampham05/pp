import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHistory } from '../contexts/HistoryContext';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/StarRating';
import { ShoppingCart } from 'lucide-react';
import { buildApiUrl, resolveImageUrl } from '../config/api';
import { toast } from 'react-toastify';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToHistory } = useHistory();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const stock = book?.stock ?? 0;
  const isOutOfStock = stock === 0;

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const token = localStorage.getItem("token");
  
        const res = await fetch(buildApiUrl(`/books/${id}`), {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {}
        });
  
        const data = await res.json().catch(() => null);
  
        if (!res.ok) {
          if (res.status === 401) {
            setError("Bạn cần đăng nhập để xem sách");
            return;
          }
  
          throw new Error(data?.message || "Không thể tải sách");
        }
  
        const foundBook = data?.result || data;
        setBook(foundBook);
  
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
  
    fetchBook();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để mua hàng");
      navigate('/login');
      return;
    }

    if (isOutOfStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    try {
      const token = localStorage.getItem("token");
    
      const res = await fetch(buildApiUrl('/cart'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: book.id,
          quantity: 1
        })
      });
    
      const data = await res.json().catch(() => null);
    
      if (!res.ok) {
        let msg = "Có lỗi xảy ra";
    
        switch (data?.code) {
          case 1011:
            msg = "Số lượng vượt quá tồn kho";
            break;
          case 1006:
            msg = "Phiên đăng nhập hết hạn";
            navigate('/login');
            break;
          default:
            msg = data?.message || msg;
        }
    
        toast.error(msg);
        return;
      }
    
      toast.success("Đã thêm sản phẩm vào giỏ hàng");
    
    } catch (err) {
      console.error(err);
      toast.error("Không thể kết nối server");
    }


  };

  const handleSubmitReview = (e) => {
    e.preventDefault();

    if (!user) {
      alert("Vui lòng đăng nhập để viết nhận xét!");
      navigate('/login');
      return;
    }

    if (userRating === 0) {
      alert("Vui lòng chọn số sao!");
      return;
    }

    const newReview = {
      user: user.fullName || user.email || "Khách",
      comment,
      rating: userRating
    };

    setReviews([newReview, ...reviews]);
    setComment('');
    setUserRating(0);
  };

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }
  
  if (!book) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mb-12">
        <div className="flex justify-center rounded-lg bg-gray-100 p-8">
          <img
            src={resolveImageUrl(book.image)}
            alt={book.title}
            className="max-w-xs rounded shadow-2xl"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-book.svg';
            }}
          />
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold">{book.title}</h1>
          <p className="mb-4 text-xl text-gray-600">Tác giả: {book.author}</p>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
            </span>
            <span className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">{book.category}</span>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <StarRating rating={book.rating} />
            <span className="text-gray-500">({reviews.length} đánh giá)</span>
          </div>

          <p className="mb-4 text-sm text-gray-500">
            {isOutOfStock ? 'Hết hàng' : `Còn ${stock} sản phẩm`}
          </p>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart /> Thêm vào giỏ hàng
          </button>
        </div>
      </div>

      <div className="border-t pt-8">
        <h2 className="mb-6 text-2xl font-bold">Đánh giá & Nhận xét</h2>

        <div className="mb-8 rounded-lg bg-gray-50 p-6">
          <h3 className="mb-4 font-semibold">Viết nhận xét của bạn</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="mb-2 block text-sm">Đánh giá của bạn:</label>
              <StarRating rating={userRating} onRate={setUserRating} editable={true} />
            </div>
            <textarea
              className="mb-4 w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Chia sẻ cảm nghĩ của bạn về sách này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <button type="submit" className="rounded bg-gray-800 px-6 py-2 text-white transition hover:bg-black">
              Gửi nhận xét
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {reviews.map((rev, index) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold">{rev.user}</span>
                <StarRating rating={rev.rating} />
              </div>
              <p className="text-gray-600">{rev.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-gray-500">Chưa có nhận xét nào.</p>}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;