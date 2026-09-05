# لالئ — متجر إكسسوارات (Full-stack)

مشروع متكامل: **React (Vite)** للواجهة + **.NET 8 Web API** للباك إند + **PostgreSQL** + حسابات عملاء وأدمن (JWT) + تكامل دفع مع **Paymob**.

```
├── frontend/    → React + Vite (الموقع اللي بيشوفه العميل والأدمن)
└── backend/     → .NET 8 Web API (المنطق + قاعدة البيانات + الدفع)
```

## 🚀 أسرع طريقة تشغلي بيها المشروع دلوقتي (Docker)

لو عندك [Docker Desktop](https://www.docker.com/products/docker-desktop/) مثبّت، تقدري تشغلي المشروع كامل (قاعدة البيانات + الباك إند + الفرونت إند) بأمر واحد بس، من غير ما تثبتي .NET أو Node أو PostgreSQL بنفسك:

```bash
cd laale-store-fullstack   # المجلد اللي فيه docker-compose.yml
docker compose up --build
```

أول تشغيل هياخد كام دقيقة (بيحمّل ويبني كل حاجة)، وبعدين:
- الموقع: **http://localhost:5180**
- الـ API: **http://localhost:5000/swagger**
- تسجيل دخول الأدمن: **admin@laale.com** / **ChangeMe123!** (تقدري تغيّريهم من `docker-compose.yml` قبل التشغيل، أو من إعدادات البيئة في أي استضافة بعدين)

**لو ظهرلك تحذير "no configuration file provided: not found"**: معناها إنك شغّلتي الأمر من مكان مش فيه ملف `docker-compose.yml` — تأكدي إنك داخلة فولدر المشروع الرئيسي (اللي جواه `frontend` و`backend` و`docker-compose.yml` كلهم في نفس المستوى) قبل ما تكتبي الأمر.

لإيقاف التشغيل: `docker compose down` (البيانات هتفضل محفوظة). لو عايزة تمسحي كل حاجة تبدئي من الأول: `docker compose down -v`

> ملحوظة: النسخة دي بتعمل جداول قاعدة البيانات تلقائيًا أول تشغيل (مش عن طريق migrations حقيقية لسه، لأني محتاجة .NET SDK عشان أعملها ومش متاح في بيئتي). لما يبقى عندك .NET SDK، شغّلي `dotnet ef migrations add InitialCreate` جوه `backend/AccessoriesStore.Api` وده هيدّيكي تحكم كامل واحترافي أكتر في تطور قاعدة البيانات مع الوقت.

---

## ملاحظة مهمة قبل ما تبدئي
الكود ده اتكتب كامل وجاهز، لكن بيئة الشغل اللي بنيت فيها المشروع مفيهاش .NET SDK، فقدرت أبني وأختبر الـ **frontend** فعليًا (بيشتغل ١٠٠٪)، لكن الـ **backend** لازم تجربيه/تبنيه عندك أو على أي سيرفر فيه .NET SDK قبل النشر، لاحتمال وجود تعديلات بسيطة مطلوبة.

---

## 1) تشغيل الـ Backend محليًا

### المتطلبات
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- PostgreSQL (تقدري تستخدمي [Neon](https://neon.tech) أو [Supabase](https://supabase.com) لو مش عايزة تثبتيه محليًا — كلاهما بيدّي قاعدة بيانات PostgreSQL مجانية على السحابة)

### الخطوات
```bash
cd backend/AccessoriesStore.Api

# ثبّتي الحزم
dotnet restore

# جهزي أدوات الـ migrations (مرة واحدة بس على جهازك)
dotnet tool install --global dotnet-ef

# عدّلي appsettings.json:
#   - ConnectionStrings:DefaultConnection → بيانات قاعدة البيانات بتاعتك
#   - Jwt:Key → مفتاح سري طويل وعشوائي (32 حرف على الأقل)
#   - Paymob:ApiKey / IntegrationId / IframeId → من حسابك على paymob.com
#   - AdminSeed:Email / Password → إيميل وباسورد أول حساب أدمن (هيتعمل تلقائي أول تشغيل)

# اعملي migration أولى وطبقيها على قاعدة البيانات
dotnet ef migrations add InitialCreate
dotnet ef database update

# شغّلي السيرفر
dotnet run
```

السيرفر هيشتغل على `http://localhost:5000` وهتلاقي توثيق الـ API التفاعلي (Swagger) على `http://localhost:5000/swagger`.

أول ما يشتغل، هيعمل تلقائي:
- الأدوار (Admin / Customer)
- حساب أدمن بالبيانات اللي حطيتيها في `AdminSeed`
- الأقسام الست الأساسية (خواتم، أساور، سلاسل، حلق، إكسسوارات شعر، شنط)

**تسجيل دخول الأدمن**: روحي `/login` في الموقع وسجلي بنفس إيميل وباسورد `AdminSeed`، وهيوديكي مباشرة على `/admin`.

---

## 2) تشغيل الـ Frontend محليًا

```bash
cd frontend
npm install
cp .env.example .env    # وغيّري VITE_API_URL لو الـ backend شغال على عنوان مختلف
npm run dev
```

هيفتح على `http://localhost:5173`. لحد ما تشغلي الـ backend، الموقع هيشتغل ببيانات تجريبية (demo data) عشان تقدري تشوفي الشكل والتصميم فورًا.

---

## 3) الربط ببوابة الدفع (Paymob)

1. افتحي حساب تاجر على [paymob.com](https://paymob.com) (بياخد أيام لحد ما يتوافق عليه)
2. من لوحة التحكم بتاعتهم، هتلاقي:
   - **API Key**
   - **Integration ID** (اختاري "Online Card" integration)
   - **Iframe ID**
3. حطيهم في `appsettings.json` تحت `Paymob`
4. من لوحة Paymob، حطي رابط الـ **Callback/Webhook** بتاعك:
   `https://your-domain.com/api/payments/paymob/callback`

بعد كده، لما العميلة تختار "دفع بالكارت" في صفحة الـ checkout، هيتوجهلها رابط دفع Paymob فعلي.

> ملحوظة أمان: الكود الحالي بيتحقق من نجاح الدفع من الـ query parameter البسيط. في مشروع إنتاج حقيقي لازم تتحقق من توقيع HMAC اللي Paymob بيبعته مع كل callback (تفاصيله في [توثيق Paymob](https://docs.paymob.com/docs/transaction-callbacks)) عشان محدش يقدر يزوّر إشعار دفع.

---

## 4) النشر (Deployment)

خيارات بسيطة ومناسبة للبداية:

| الجزء | خيارات مقترحة |
|---|---|
| Backend (.NET API) | Azure App Service, Railway, Render |
| قاعدة البيانات | Neon, Supabase, Azure Database for PostgreSQL |
| Frontend (React) | Vercel, Netlify, Cloudflare Pages |

خطوات عامة:
1. ارفعي الكود على GitHub
2. اربطي الـ backend بخدمة استضافة، وحطي متغيرات البيئة (connection string, JWT key, Paymob keys) من لوحة تحكم الاستضافة بدل ما تسيبيها في appsettings.json مباشرة
3. اربطي الـ frontend بخدمة استضافة، وحطي `VITE_API_URL` على رابط الـ backend المنشور
4. حدّثي `Cors:AllowedOrigins` في الـ backend عشان تسمح بس لدومين الـ frontend بتاعك

---

## بنية الـ API (ملخص)

| Method | Endpoint | الوصف | صلاحية |
|---|---|---|---|
| POST | `/api/auth/register` | تسجيل عميل جديد | عام |
| POST | `/api/auth/login` | تسجيل دخول | عام |
| GET | `/api/categories` | الأقسام | عام |
| GET | `/api/products` | كل المنتجات (فلترة بـ `?category=slug`) | عام |
| GET | `/api/products/{id}` | منتج واحد | عام |
| POST | `/api/orders` | إنشاء طلب | عميل مسجل |
| GET | `/api/orders/mine` | طلبات العميل | عميل مسجل |
| POST | `/api/payments/paymob/initiate` | بدء الدفع بالكارت | عميل مسجل |
| POST | `/api/payments/paymob/callback` | استقبال نتيجة الدفع من Paymob | Paymob فقط |
| GET | `/api/admin/orders` | كل الطلبات | أدمن فقط |
| PUT | `/api/admin/orders/{id}/status` | تغيير حالة الطلب | أدمن فقط |
| POST/PUT/DELETE | `/api/admin/products` | إدارة المنتجات | أدمن فقط |

---

## أفكار للتطوير لاحقًا
- رفع صور المنتجات فعليًا (بدل ما تكون روابط) عن طريق تخزين سحابي زي Cloudinary أو Azure Blob Storage
- صفحة "نسيت كلمة المرور"
- إشعارات إيميل/واتساب تلقائية لما حالة الطلب تتغير
- تتبع الشحنة (Shipping Tracking) بالتكامل مع شركة الشحن
