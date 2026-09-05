import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { demoCategories, demoProducts } from "../data/demoProducts";
import { useCart } from "../context/CartContext";

export default function Home() {
  const [categories, setCategories] = useState(demoCategories);
  const [products, setProducts] = useState(demoProducts);
  const [activeCat, setActiveCat] = useState("all");
  const [usingDemo, setUsingDemo] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    api.getCategories()
      .then((cats) => { setCategories(cats); setUsingDemo(false); })
      .catch(() => { /* fallback to demo data already set */ });
  }, []);

  useEffect(() => {
    api.getProducts(activeCat === "all" ? undefined : activeCat)
      .then((prods) => { setProducts(prods); setUsingDemo(false); })
      .catch(() => {
        setProducts(activeCat === "all" ? demoProducts : demoProducts.filter((p) => p.category === activeCat));
      });
  }, [activeCat]);

  return (
    <>
      {usingDemo && (
        <div className="demo-banner wrap">
          وضع تجريبي: البيانات دلوقتي محلية لحد ما تشغلي الـ backend وتربطيه بـ API الحقيقي.
        </div>
      )}

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">تشكيلة صيف ٢٠٢٦</div>
            <h1>إكسسوارات تحكي <span>ذوقك</span><br />من غير ما تتكلمي</h1>
            <p>تشكيلة مختارة بعناية من الخواتم والأساور والسلاسل — تصميم بسيط، جودة تدوم، وأسعار في متناول اليد والشحن مجانا لاول 4 شهور. </p>

            <a href="#catalog" className="btn">تسوقي الكولكشن</a>
          </div>
          <div className="hero-side">
            <div className="badge">
              <div className="badge-core">
                <strong>خصم ١٥٪</strong>
                <span>لأول طلب أونلاين</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"><div className="l"></div><div className="gem"></div><div className="l"></div></div>

      <main className="wrap" id="catalog">
        <div className="section-head">
          <div className="eyebrow">الكتالوج</div>
          <h2>اختاري قطعتك</h2>
        </div>

        <div className="filters">
          <button className={`chip ${activeCat === "all" ? "active" : ""}`} onClick={() => setActiveCat("all")}>الكل</button>
          {categories.map((c) => (
            <button key={c.slug} className={`chip ${activeCat === c.slug ? "active" : ""}`} onClick={() => setActiveCat(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid">
          {products.map((p) => (
            <div className="card" key={p.id}>
              <Link to={`/product/${p.id}`} className="card-media">
                {p.tag && <span className="tag">{p.tag}</span>}
                <img src={p.imageUrl} alt={p.name} loading="lazy" />
              </Link>
              <div className="card-body">
                <h3><Link to={`/product/${p.id}`}>{p.name}</Link></h3>
                <div className="price-row">
                  <span className="price">{p.price} ج.م</span>
                  {p.oldPrice && <span className="old-price">{p.oldPrice} ج.م</span>}
                </div>
                <button className="order-btn" onClick={() => addItem(p)}>أضيفي للسلة</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
