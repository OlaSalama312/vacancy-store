import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { demoProducts } from "../data/demoProducts";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    api.getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(demoProducts.find((p) => String(p.id) === String(id))));
  }, [id]);

  if (!product) return <div className="wrap" style={{ padding: "80px 0" }}>...جاري التحميل</div>;

  return (
    <div className="wrap product-detail">
      <Link to="/" className="back-link">← رجوع للكتالوج</Link>
      <div className="pd-grid">
        <div className="pd-media">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        <div className="pd-info">
          <h1>{product.name}</h1>
          <div className="price-row" style={{ margin: "18px 0" }}>
            <span className="price" style={{ fontSize: 28 }}>{product.price} ج.م</span>
            {product.oldPrice && <span className="old-price">{product.oldPrice} ج.م</span>}
          </div>
          <p className="pd-desc">
            قطعة مختارة بعناية من تشكيلة لالئ، خامة عالية الجودة ومقاومة للاسوداد.
            مناسبة للاستخدام اليومي والمناسبات.
          </p>
          <div className="qty-row">
            <label>الكمية</label>
            <div className="qty-control">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>
          <button className="btn btn-block" onClick={() => addItem(product, qty)}>
            أضيفي للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
