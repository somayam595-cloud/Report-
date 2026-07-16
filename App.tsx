import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArchiveRestore,
  Bot,
  CalendarDays,
  Download,
  FileDown,
  FilePlus2,
  FileText,
  Hash,
  ImagePlus,
  LoaderCircle,
  Printer,
  RotateCcw,
  Save,
  School,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { GenerationResponse, ProgramReport } from './types';
// مكتبة لا توفر تعريفات TypeScript كاملة.
// @ts-ignore
import html2pdf from 'html2pdf.js';

const STORAGE_KEY = 'school-program-reports-v1';
const SCHOOL_KEY = 'school-program-reports-school';
const MAX_IMAGES = 4;

const reportTypes = [
  'تقرير نشاط مدرسي عام',
  'تقرير برنامج ثقافي',
  'تقرير برنامج اجتماعي',
  'تقرير برنامج علمي',
  'تقرير برنامج رياضي',
  'تقرير توعوي وإرشاد طلابي',
  'تقرير ورشة عمل أو تدريب',
  'تقرير فعالية وطنية',
  'تقرير مبادرة تطوعية',
  'تقرير اجتماع مجلس المدرسة',
];

const emptyReport = (schoolName = ''): ProgramReport => ({
  id: crypto.randomUUID?.() ?? `report-${Date.now()}`,
  schoolName,
  programName: '',
  programField: '',
  reportType: reportTypes[0],
  progDate: new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date()),
  progExec: '',
  progBene: '',
  progCount: '',
  goals: '',
  steps: '',
  images: [],
  createdAt: new Date().toISOString(),
  preparerTitle: 'معدة التقرير',
  preparerName: '',
  managerTitle: 'مديرة المدرسة',
  managerName: '',
});

const sampleReport: ProgramReport = {
  ...emptyReport('مدرستي'),
  id: 'sample-report',
  programName: 'اليوم العالمي للغة العربية',
  programField: 'النشاط الثقافي والأدبي',
  reportType: 'تقرير برنامج ثقافي',
  progExec: 'جماعة اللغة العربية',
  progBene: 'طالبات المدرسة ومنسوباتها',
  progCount: 'أكثر من 150 مستفيدة',
  goals:
    '1. تعزيز الاعتزاز باللغة العربية بوصفها مكوّناً أساسياً للهوية الوطنية.\n2. تنمية مهارات القراءة والتعبير والإلقاء لدى الطالبات.\n3. إبراز جماليات الخط العربي والفنون المرتبطة به.\n4. تشجيع المشاركة في الأنشطة الثقافية والمسابقات المدرسية.',
  steps:
    '1. إعداد الخطة التنفيذية وتوزيع الأدوار على فريق العمل.\n2. الإعلان عن البرنامج ومسابقاته في قنوات المدرسة.\n3. تنفيذ الإذاعة المدرسية والأركان الثقافية المصاحبة.\n4. عرض مشاركات الطالبات وتوثيق الشواهد بالصور.\n5. تقييم البرنامج وتكريم المشاركات وإعداد التقرير الختامي.',
};

function localGeneration(programName: string): GenerationResponse {
  const name = programName.trim();
  const isTraining = /دورة|ورشة|تدريب|مهارات/.test(name);
  const isNational = /وطني|تأسيس|علم|بيعة/.test(name);
  const isScience = /علوم|ابتكار|روبوت|ذكاء|تقني|فضاء/.test(name);
  const isHealth = /صحة|غذاء|رياض|لياقة|سكري|سلامة/.test(name);

  let field = 'النشاط المدرسي العام';
  let beneficiaries = 'طالبات المدرسة ومنسوباتها';
  let count = 'أكثر من 100 مستفيدة';

  if (isTraining) {
    field = 'التدريب والتطوير المهني';
    beneficiaries = 'الهيئة التعليمية والإدارية';
    count = 'نحو 35 مستفيدة';
  } else if (isNational) {
    field = 'الفعاليات والمناسبات الوطنية';
  } else if (isScience) {
    field = 'النشاط العلمي والابتكاري';
  } else if (isHealth) {
    field = 'التوعية الصحية والبدنية';
  }

  return {
    field,
    beneficiaries,
    count,
    isFallback: true,
    goals: `1. تعزيز الوعي بأهمية برنامج «${name}» وربطه بالقيم التربوية والوطنية.\n2. تنمية معارف المستفيدات ومهاراتهن من خلال أنشطة تطبيقية هادفة.\n3. تشجيع المشاركة الإيجابية والعمل الجماعي وتحمل المسؤولية.\n4. قياس أثر البرنامج وتوظيف نتائجه في تحسين البرامج المستقبلية.`,
    steps: `1. تحديد أهداف برنامج «${name}» والفئة المستهدفة ومؤشرات النجاح.\n2. تشكيل فريق العمل وتوزيع المهام وإعداد الجدول الزمني.\n3. الإعلان عن البرنامج وتجهيز المكان والوسائل والمواد اللازمة.\n4. تنفيذ الأنشطة المقررة مع متابعة الحضور والتفاعل.\n5. توثيق الشواهد بالصور وجمع التغذية الراجعة.\n6. تحليل النتائج وإعداد التقرير الختامي وتكريم المشاركات.`,
  };
}

function normalizeReport(report: ProgramReport): ProgramReport {
  return {
    ...emptyReport(report.schoolName || ''),
    ...report,
    images: Array.isArray(report.images) ? report.images.slice(0, MAX_IMAGES) : [],
  };
}

export default function App() {
  const [reports, setReports] = useState<ProgramReport[]>([]);
  const [activeId, setActiveId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedSchool = localStorage.getItem(SCHOOL_KEY) || 'مدرستي';
    setSchoolName(storedSchool);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ProgramReport[]) : [];
      const initial = parsed.length ? parsed.map(normalizeReport) : [{ ...sampleReport, schoolName: storedSchool }];
      setReports(initial);
      setActiveId(initial[0].id);
    } catch {
      const initial = { ...sampleReport, schoolName: storedSchool };
      setReports([initial]);
      setActiveId(initial.id);
    }
  }, []);

  const active = useMemo(
    () => reports.find((report) => report.id === activeId) ?? reports[0] ?? sampleReport,
    [activeId, reports],
  );

  const persist = (next: ProgramReport[]) => {
    setReports(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateActive = (patch: Partial<ProgramReport>) => {
    persist(reports.map((report) => (report.id === active.id ? { ...report, ...patch } : report)));
  };

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const updateSchool = (value: string) => {
    setSchoolName(value);
    localStorage.setItem(SCHOOL_KEY, value);
    persist(reports.map((report) => ({ ...report, schoolName: value })));
  };

  const createReport = () => {
    const report = emptyReport(schoolName);
    persist([report, ...reports]);
    setActiveId(report.id);
    notify('تم إنشاء تقرير جديد.');
  };

  const deleteReport = () => {
    if (reports.length === 1) {
      notify('يجب إبقاء تقرير واحد على الأقل.');
      return;
    }
    if (!window.confirm('هل تريدين حذف التقرير الحالي؟')) return;
    const next = reports.filter((report) => report.id !== active.id);
    persist(next);
    setActiveId(next[0].id);
    notify('تم حذف التقرير.');
  };

  const resetReport = () => {
    if (!window.confirm('سيتم مسح بيانات التقرير الحالي. هل تريدين المتابعة؟')) return;
    const reset = emptyReport(schoolName);
    updateActive({ ...reset, id: active.id, createdAt: active.createdAt });
    notify('تم مسح الحقول.');
  };

  const generate = async () => {
    if (!active.programName.trim()) {
      notify('أدخلي اسم البرنامج أولاً.');
      return;
    }

    setIsGenerating(true);
    try {
      let data: GenerationResponse;
      try {
        const response = await fetch('./api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programName: active.programName,
            programField: active.programField,
          }),
        });
        if (!response.ok) throw new Error('API unavailable');
        data = (await response.json()) as GenerationResponse;
      } catch {
        // على GitHub Pages لا يوجد خادم Node؛ لذلك تعمل مسودة محلية بديلة تلقائياً.
        data = localGeneration(active.programName);
      }

      updateActive({
        goals: data.goals || active.goals,
        steps: data.steps || active.steps,
        programField: data.field || active.programField,
        progBene: data.beneficiaries || active.progBene,
        progCount: data.count || active.progCount,
      });
      notify(data.isFallback ? 'تم إنشاء مسودة محلية قابلة للتعديل.' : 'تم إنشاء التقرير بالذكاء الاصطناعي.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addImages = (files: FileList | null) => {
    if (!files?.length) return;
    const freeSlots = MAX_IMAGES - active.images.length;
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, freeSlots);

    if (!selected.length) {
      notify(freeSlots ? 'اختاري ملفات صور صحيحة.' : 'تم الوصول إلى الحد الأعلى: أربع صور.');
      return;
    }

    Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((images) => {
        updateActive({ images: [...active.images, ...images].slice(0, MAX_IMAGES) });
        notify('تمت إضافة صور الشواهد.');
      })
      .catch(() => notify('تعذر قراءة إحدى الصور.'));
  };

  const exportPdf = async () => {
    const element = document.getElementById('report-print-area');
    if (!element) return;
    setIsExporting(true);
    try {
      await html2pdf()
        .set({
          margin: 7,
          filename: `تقرير_${active.programName || 'برنامج_مدرسي'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
      notify('تم تنزيل ملف PDF.');
    } catch {
      notify('تعذر إنشاء PDF؛ استخدمي زر الطباعة وحفظه بصيغة PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_للتقارير_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file?: File) => {
    if (!file) return;
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text) as ProgramReport[];
        if (!Array.isArray(parsed) || !parsed.length) throw new Error('invalid');
        const next = parsed.map(normalizeReport);
        persist(next);
        setActiveId(next[0].id);
        notify('تم استيراد النسخة الاحتياطية.');
      })
      .catch(() => notify('ملف النسخة الاحتياطية غير صالح.'))
      .finally(() => {
        if (importRef.current) importRef.current.value = '';
      });
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10';
  const labelClass = 'mb-1.5 block text-xs font-bold text-slate-600';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {message && (
        <div className="no-print fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full bg-deep px-5 py-2.5 text-sm font-bold text-white shadow-xl">
          {message}
        </div>
      )}

      <header className="no-print border-b border-white/10 bg-deep text-white shadow-lg">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-white p-2 shadow-inner">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="شعار وزارة التعليم" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gold-light md:text-2xl">منصة تقارير البرامج المدرسية</h1>
              <p className="mt-1 text-xs text-slate-300">إعداد وحفظ وطباعة التقارير باللغة العربية</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={createReport} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-deep hover:bg-gold-light">
              <FilePlus2 className="h-4 w-4" /> تقرير جديد
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10">
              <Printer className="h-4 w-4" /> طباعة
            </button>
            <button onClick={exportPdf} disabled={isExporting} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-50">
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-12">
        <aside className="no-print space-y-5 xl:col-span-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-teal" />
                <h2 className="font-black text-deep">إعدادات المدرسة والتقارير</h2>
              </div>
              <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">حفظ تلقائي</span>
            </div>

            <label className={labelClass}>اسم المدرسة</label>
            <input value={schoolName} onChange={(event) => updateSchool(event.target.value)} className={fieldClass} placeholder="اكتبي اسم المدرسة" />

            <label className={`${labelClass} mt-4`}>التقارير المحفوظة</label>
            <select value={active.id} onChange={(event) => setActiveId(event.target.value)} className={fieldClass}>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.programName || 'تقرير غير معنون'}
                </option>
              ))}
            </select>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={deleteReport} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
                <Trash2 className="h-4 w-4" /> حذف
              </button>
              <button onClick={resetReport} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold hover:bg-slate-200">
                <RotateCcw className="h-4 w-4" /> مسح الحقول
              </button>
              <button onClick={exportBackup} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold hover:bg-slate-200">
                <Download className="h-4 w-4" /> تصدير نسخة
              </button>
              <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold hover:bg-slate-200">
                <ArchiveRestore className="h-4 w-4" /> استيراد
              </button>
              <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => importBackup(event.target.files?.[0])} />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal" />
              <h2 className="font-black text-deep">بيانات البرنامج</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>نوع التقرير</label>
                <select value={active.reportType} onChange={(event) => updateActive({ reportType: event.target.value })} className={fieldClass}>
                  {reportTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>اسم البرنامج</label>
                <input value={active.programName} onChange={(event) => updateActive({ programName: event.target.value })} className={fieldClass} placeholder="مثال: اليوم العالمي للغة العربية" />
              </div>
              <div>
                <label className={labelClass}>المجال</label>
                <input value={active.programField} onChange={(event) => updateActive({ programField: event.target.value })} className={fieldClass} placeholder="النشاط الثقافي" />
              </div>
              <div>
                <label className={labelClass}>تاريخ التنفيذ</label>
                <input value={active.progDate} onChange={(event) => updateActive({ progDate: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الجهة المنفذة</label>
                <input value={active.progExec} onChange={(event) => updateActive({ progExec: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الفئة المستفيدة</label>
                <input value={active.progBene} onChange={(event) => updateActive({ progBene: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>عدد المستفيدات</label>
                <input value={active.progCount} onChange={(event) => updateActive({ progCount: event.target.value })} className={fieldClass} />
              </div>
            </div>

            <button onClick={generate} disabled={isGenerating} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-teal to-cyan-600 px-4 py-3 font-black text-white shadow-lg shadow-cyan-900/10 hover:brightness-105 disabled:opacity-60">
              {isGenerating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isGenerating ? 'جاري إعداد المسودة...' : 'صياغة الأهداف والخطوات بذكاء'}
            </button>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <label className={labelClass}>الأهداف</label>
            <textarea value={active.goals} onChange={(event) => updateActive({ goals: event.target.value })} className={`${fieldClass} min-h-40 resize-y leading-7`} />
            <label className={`${labelClass} mt-4`}>خطوات التنفيذ</label>
            <textarea value={active.steps} onChange={(event) => updateActive({ steps: event.target.value })} className={`${fieldClass} min-h-48 resize-y leading-7`} />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-teal" />
                <h2 className="font-black text-deep">صور الشواهد</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">{active.images.length}/{MAX_IMAGES}</span>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-5 text-sm font-bold text-slate-500 hover:border-teal hover:bg-teal/5 hover:text-teal">
              <Upload className="h-5 w-5" /> إضافة صور
              <input type="file" accept="image/*" multiple hidden onChange={(event) => addImages(event.target.files)} />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {active.images.map((image, index) => (
                <div key={`${image.slice(0, 30)}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={image} alt={`شاهد ${index + 1}`} className="h-28 w-full object-cover" />
                  <button onClick={() => updateActive({ images: active.images.filter((_, imageIndex) => imageIndex !== index) })} className="absolute left-2 top-2 rounded-full bg-black/65 p-1 text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 flex items-center gap-2 font-black text-deep"><Save className="h-5 w-5 text-teal" /> الاعتماد</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>صفة معدة التقرير</label>
                <input value={active.preparerTitle || ''} onChange={(event) => updateActive({ preparerTitle: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الاسم</label>
                <input value={active.preparerName || ''} onChange={(event) => updateActive({ preparerName: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>صفة قائدة المدرسة</label>
                <input value={active.managerTitle || ''} onChange={(event) => updateActive({ managerTitle: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الاسم</label>
                <input value={active.managerName || ''} onChange={(event) => updateActive({ managerName: event.target.value })} className={fieldClass} />
              </div>
            </div>
          </section>
        </aside>

        <section className="xl:col-span-7">
          <div className="no-print mb-3 flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-teal" /> معاينة التقرير النهائية</span>
            <span>مقاس A4</span>
          </div>

          <article id="report-print-area" className="print-page-container mx-auto min-h-[1120px] max-w-[794px] overflow-hidden rounded-sm bg-white shadow-xl ring-1 ring-slate-200">
            <div className="h-3 bg-gradient-to-l from-teal via-cyan-600 to-sky-600" />
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between gap-5 border-b-2 border-gold pb-5">
                <div>
                  <p className="text-xs font-bold text-teal">المملكة العربية السعودية</p>
                  <p className="mt-1 text-sm font-bold text-slate-600">وزارة التعليم</p>
                  <p className="mt-1 text-sm font-black text-deep">{active.schoolName || schoolName || 'اسم المدرسة'}</p>
                </div>
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="شعار وزارة التعليم" className="h-24 w-36 object-contain" />
              </div>

              <div className="my-7 text-center">
                <span className="inline-block rounded-full bg-teal/10 px-4 py-1.5 text-xs font-black text-teal">{active.reportType}</span>
                <h2 className="print-title mt-4 text-2xl font-black text-deep">{active.programName || 'اسم البرنامج المدرسي'}</h2>
                {active.programField && <p className="mt-2 text-sm font-bold text-slate-500">المجال: {active.programField}</p>}
              </div>

              <div className="print-grid grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  [CalendarDays, 'تاريخ التنفيذ', active.progDate],
                  [School, 'الجهة المنفذة', active.progExec],
                  [Users, 'الفئة المستفيدة', active.progBene],
                  [Hash, 'عدد المستفيدات', active.progCount],
                ].map(([Icon, title, value], index) => {
                  const IconComponent = Icon as React.ComponentType<{ className?: string }>;
                  return (
                    <div key={index} className="print-card rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1">
                      <div className="mb-1 flex items-center gap-2 text-xs font-black text-teal"><IconComponent className="h-4 w-4" />{String(title)}</div>
                      <p className="min-h-6 text-sm font-bold text-slate-700">{String(value || '—')}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-5">
                <section className="print-card rounded-2xl border border-slate-200 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-black text-deep"><Sparkles className="h-5 w-5 text-gold" /> أهداف البرنامج</h3>
                  <p className="whitespace-pre-line text-sm leading-8 text-slate-700">{active.goals || 'تُكتب أهداف البرنامج هنا.'}</p>
                </section>

                <section className="print-card rounded-2xl border border-slate-200 p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-black text-deep"><FileText className="h-5 w-5 text-gold" /> خطوات التنفيذ</h3>
                  <p className="whitespace-pre-line text-sm leading-8 text-slate-700">{active.steps || 'تُكتب خطوات تنفيذ البرنامج هنا.'}</p>
                </section>
              </div>

              {active.images.length > 0 && (
                <section className="print-card mt-6 rounded-2xl border border-slate-200 p-5">
                  <h3 className="mb-4 text-base font-black text-deep">الشواهد المصورة</h3>
                  <div className="print-half-grid grid grid-cols-2 gap-3">
                    {active.images.map((image, index) => (
                      <figure key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <img src={image} alt={`شاهد مصور ${index + 1}`} className="h-44 w-full rounded-lg object-cover" />
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 text-center text-sm">
                <div>
                  <p className="font-black text-deep">{active.preparerTitle || 'معدة التقرير'}</p>
                  <p className="mt-3 min-h-6 font-bold text-slate-600">{active.preparerName || '................................'}</p>
                  <p className="mt-5 text-xs text-slate-400">التوقيع</p>
                </div>
                <div>
                  <p className="font-black text-deep">{active.managerTitle || 'مديرة المدرسة'}</p>
                  <p className="mt-3 min-h-6 font-bold text-slate-600">{active.managerName || '................................'}</p>
                  <p className="mt-5 text-xs text-slate-400">التوقيع والختم</p>
                </div>
              </div>

              <footer className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] font-bold text-slate-400">
                <span>منصة تقارير البرامج المدرسية</span>
                <span>تم إنشاء التقرير إلكترونياً</span>
              </footer>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
