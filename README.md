# منصة تقارير البرامج المدرسية

مشروع React + TypeScript + Vite باللغة العربية، جاهز للرفع إلى GitHub وتشغيله بطريقتين:

1. **GitHub Pages:** نسخة ثابتة تعمل مباشرة، وتستخدم مولداً محلياً احتياطياً لصياغة الأهداف والخطوات.
2. **استضافة Node.js:** تشغّل خادم Express وتتيح استخدام Gemini من خلال مفتاح سري على الخادم.

## التشغيل محلياً

يتطلب المشروع Node.js 20 أو أحدث.

```bash
npm install
cp .env.example .env.local
npm run dev
```

يفتح التطبيق افتراضياً على:

```text
http://localhost:3000
```

## النشر على GitHub Pages

1. أنشئي مستودعاً جديداً في GitHub.
2. ارفعي **محتويات هذا المجلد** إلى الفرع `main`.
3. افتحي: `Settings` ثم `Pages`.
4. عند `Source` اختاري `GitHub Actions`.
5. انتظري اكتمال مهمة **Deploy GitHub Pages** في تبويب `Actions`.

تم ضبط `vite.config.ts` على مسارات نسبية؛ لذلك لا يلزم إدخال اسم المستودع داخل الإعدادات.

> GitHub Pages لا يشغّل خادم Express ولا يحفظ مفتاح Gemini. عند النشر عليه يستخدم التطبيق الصياغة المحلية الاحتياطية تلقائياً، بينما تبقى جميع وظائف إدخال البيانات والحفظ والطباعة وPDF والنسخ الاحتياطي متاحة.

## تشغيل Gemini على استضافة Node.js

ضعي متغير البيئة التالي في لوحة الاستضافة، ولا تضعي المفتاح داخل ملفات GitHub:

```text
GEMINI_API_KEY=your_secret_key
```

ثم استخدمي:

```bash
npm ci
npm run build
npm start
```

## أهم الملفات

- `App.tsx`: واجهة المنصة.
- `server.ts`: خادم Express ومسار Gemini.
- `public/logo.png`: الشعار.
- `.github/workflows/deploy-pages.yml`: النشر التلقائي إلى Pages.
- `.env.example`: مثال آمن لمتغيرات البيئة.

## الأمان

ملفات `.env` الحقيقية مستبعدة من Git عبر `.gitignore`. لا ترفعي مفتاح Gemini أو أي بيانات سرية إلى المستودع.
