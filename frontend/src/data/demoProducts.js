// بيانات تجريبية (تُستخدم لو الـ backend لسه مش متوصل) — استبدليها ببيانات حقيقية من الـ API
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

export const demoCategories = [
  { slug: "rings", name: "خواتم" },
  { slug: "bracelets", name: "أساور" },
  { slug: "necklaces", name: "سلاسل" },
  { slug: "earrings", name: "حلق" },
  { slug: "hair", name: "إكسسوارات شعر" },
  { slug: "bags", name: "شنط" },
];

export const demoProducts = [
  { id: 1, category: "rings", name: "خاتم لؤلؤة ذهبي", price: 220, oldPrice: 280, tag: "الأكثر مبيعًا", imageUrl: img("1564616929085-9cd5d2e030a7") },
  { id: 2, category: "rings", name: "خاتم مزدوج مينيمال", price: 180, imageUrl: img("1564616929085-9cd5d2e030a7") },
  { id: 3, category: "bracelets", name: "أسورة سلسلة ذهبي", price: 250, oldPrice: 310, tag: "جديد", imageUrl: img("1602527428055-a2526fabdc9f") },
  { id: 4, category: "bracelets", name: "أسورة شارم فضي", price: 195, imageUrl: img("1602527428055-a2526fabdc9f") },
  { id: 5, category: "necklaces", name: "سلسلة لؤلؤة كلاسيك", price: 260, imageUrl: img("1654699991520-aaaf4dd2608b") },
  { id: 6, category: "necklaces", name: "سلسلة اسم مخصص", price: 340, tag: "مخصص", imageUrl: img("1654699991520-aaaf4dd2608b") },
  { id: 7, category: "earrings", name: "حلق حلقات دائرية", price: 160, imageUrl: img("1680968921717-4abbbe793bb3") },
  { id: 8, category: "earrings", name: "حلق تعليقة لؤلؤ", price: 190, oldPrice: 230, imageUrl: img("1680968921717-4abbbe793bb3") },
  { id: 9, category: "hair", name: "مشبك شعر لؤلؤ", price: 95, imageUrl: img("1654699991520-aaaf4dd2608b") },
  { id: 10, category: "hair", name: "طوق شعر ساتان", price: 110, imageUrl: img("1654699991520-aaaf4dd2608b") },
  { id: 11, category: "bags", name: "شنطة يد صغيرة", price: 420, tag: "جديد", imageUrl: img("1572196223922-d8b7e0ab0b4d") },
  { id: 12, category: "bags", name: "شنطة كروس جلد", price: 480, imageUrl: img("1572196223922-d8b7e0ab0b4d") },
];
