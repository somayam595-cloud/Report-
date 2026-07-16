import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArchiveRestore,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Download,
  FileDown,
  FilePlus2,
  FileText,
  Hash,
  ImagePlus,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Menu,
  Printer,
  RotateCcw,
  Save,
  School,
  Search,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';
import { buildSmartDraft } from './reportEngine';
import type { EditorTab, EvidenceImage, ProgramReport, SaveState } from './types';

const STORAGE_KEY = 'school-program-reports-v2';
const LEGACY_STORAGE_KEY = 'school-program-reports-v1';
const SETTINGS_KEY = 'school-program-reports-settings-v2';
const MAX_IMAGES = 4;
const MAX_IMAGE_FILE_SIZE = 12 * 1024 * 1024;

const reportTypes = [
  'تقرير برنامج مدرسي',
  'تقرير فعالية وطنية',
  'تقرير برنامج ثقافي',
  'تقرير برنامج اجتماعي',
  'تقرير برنامج علمي وتقني',
  'تقرير برنامج صحي ورياضي',
  'تقرير توعوي وإرشادي',
  'تقرير ورشة عمل أو تدريب',
  'تقرير مبادرة تطوعية',
  'تقرير شراكة مجتمعية',
];

const tabs: Array<{ id: EditorTab; label: string; icon: typeof FileText }> = [
  { id: 'details', label: 'بيانات البرنامج', icon: ClipboardList },
  { id: 'content', label: 'المحتوى والنتائج', icon: FileText },
  { id: 'evidence', label: 'الشواهد والاعتماد', icon: ImagePlus },
];

function makeId(prefix = 'item'): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function todayHijri(): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('ar-SA').format(new Date());
  }
}

function createEmptyReport(defaults?: Partial<ProgramReport>): ProgramReport {
  const now = new Date().toISOString();
  return {
    id: makeId('report'),
    schoolName: '',
    educationOffice: '',
    reportType: reportTypes[0],
    programName: '',
    programField: '',
    programDate: todayHijri(),
    programTime: '',
    duration: '',
    location: '',
    executor: '',
    beneficiaries: '',
    beneficiaryCount: '',
    goals: '',
    steps: '',
    outcomes: '',
    recommendations: '',
    notes: '',
    images: [],
    preparerTitle: 'معدة التقرير',
    preparerName: '',
    managerTitle: 'مديرة المدرسة',
    managerName: '',
    createdAt: now,
    updatedAt: now,
    ...defaults,
  };
}

function migrateReport(value: unknown, fallbackSchool = '', fallbackOffice = ''): ProgramReport {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const rawImages = Array.isArray(source.images) ? source.images : [];
  const images: EvidenceImage[] = rawImages
    .slice(0, MAX_IMAGES)
    .map((image, index) => {
      if (typeof image === 'string') {
        return { id: makeId('image'), dataUrl: image, caption: `الشاهد المصور ${index + 1}` };
      }
      const objectImage = image && typeof image === 'object' ? (image as Record<string, unknown>) : {};
      return {
        id: typeof objectImage.id === 'string' ? objectImage.id : makeId('image'),
        dataUrl: typeof objectImage.dataUrl === 'string' ? objectImage.dataUrl : '',
        caption: typeof objectImage.caption === 'string' ? objectImage.caption : `الشاهد المصور ${index + 1}`,
      };
    })
    .filter((image) => image.dataUrl.startsWith('data:image/'));

  const now = new Date().toISOString();
  return createEmptyReport({
    id: typeof source.id === 'string' && source.id ? source.id : makeId('report'),
    schoolName: String(source.schoolName ?? fallbackSchool),
    educationOffice: String(source.educationOffice ?? fallbackOffice),
    reportType: String(source.reportType ?? reportTypes[0]),
    programName: String(source.programName ?? ''),
    programField: String(source.programField ?? ''),
    programDate: String(source.programDate ?? source.progDate ?? todayHijri()),
    programTime: String(source.programTime ?? ''),
    duration: String(source.duration ?? ''),
    location: String(source.location ?? ''),
    executor: String(source.executor ?? source.progExec ?? ''),
    beneficiaries: String(source.beneficiaries ?? source.progBene ?? ''),
    beneficiaryCount: String(source.beneficiaryCount ?? source.progCount ?? ''),
    goals: String(source.goals ?? ''),
    steps: String(source.steps ?? ''),
    outcomes: String(source.outcomes ?? ''),
    recommendations: String(source.recommendations ?? ''),
    notes: String(source.notes ?? ''),
    images,
    preparerTitle: String(source.preparerTitle ?? 'معدة التقرير'),
    preparerName: String(source.preparerName ?? ''),
    managerTitle: String(source.managerTitle ?? 'مديرة المدرسة'),
    managerName: String(source.managerName ?? ''),
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : now,
  });
}

function loadInitialReports(): ProgramReport[] {
  let defaults = { schoolName: localStorage.getItem('school-program-reports-school') || '', educationOffice: '' };
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as Partial<typeof defaults>;
    defaults = {
      schoolName: typeof saved.schoolName === 'string' ? saved.schoolName : '',
      educationOffice: typeof saved.educationOffice === 'string' ? saved.educationOffice : '',
    };
  } catch {
    // نستخدم القيم الافتراضية عند تلف الإعدادات.
  }

  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null') as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { reports?: unknown[] }).reports)
          ? (parsed as { reports: unknown[] }).reports
          : [];
      if (list.length) return list.map((item) => migrateReport(item, defaults.schoolName, defaults.educationOffice));
    } catch {
      // ننتقل إلى المفتاح التالي أو ننشئ تقريراً جديداً.
    }
  }

  return [createEmptyReport(defaults)];
}

function safeFileName(value: string): string {
  return (value.trim() || 'برنامج_مدرسي')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function compressImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_FILE_SIZE) throw new Error('image-too-large');

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read-error'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('image-error'));
    element.src = source;
  });

  const maxDimension = 1100;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas-error');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'number';
  onChange: (value: string) => void;
  className?: string;
}

function Field({ label, value, placeholder, type = 'text', onChange, className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-extrabold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field-control"
      />
    </label>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  helper?: string;
  onChange: (value: string) => void;
}

function TextAreaField({ label, value, placeholder, rows = 6, helper, onChange }: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-slate-600">
        <span>{label}</span>
        {helper && <span className="font-medium text-slate-400">{helper}</span>}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field-control resize-y leading-7"
      />
    </label>
  );
}

export default function App() {
  const [reports, setReports] = useState<ProgramReport[]>([]);
  const [activeId, setActiveId] = useState('');
  const [activeTab, setActiveTab] = useState<EditorTab>('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [toast, setToast] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const initial = loadInitialReports();
    setReports(initial);
    setActiveId(initial[0].id);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !reports.length) return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, reports }));
        const current = reports.find((report) => report.id === activeId) ?? reports[0];
        localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({ schoolName: current.schoolName, educationOffice: current.educationOffice }),
        );
        setSaveState('saved');
      } catch {
        setSaveState('error');
        showToast('تعذر الحفظ داخل المتصفح. قلّلي عدد الصور أو صدّري نسخة احتياطية.');
      }
    }, 450);
    return () => window.clearTimeout(timer);
    // showToast ثابتة عملياً ولا تحتاج للإضافة إلى الاعتماديات.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, activeId, loaded]);

  const activeReport = useMemo(
    () => reports.find((report) => report.id === activeId) ?? reports[0] ?? createEmptyReport(),
    [activeId, reports],
  );

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      [report.programName, report.reportType, report.programField, report.programDate]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [reports, searchTerm]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3500);
  }

  function updateActive(patch: Partial<ProgramReport>) {
    const updatedAt = new Date().toISOString();
    setReports((current) =>
      current.map((report) => (report.id === activeReport.id ? { ...report, ...patch, updatedAt } : report)),
    );
  }

  function createReport() {
    const report = createEmptyReport({
      schoolName: activeReport.schoolName,
      educationOffice: activeReport.educationOffice,
      preparerTitle: activeReport.preparerTitle,
      preparerName: activeReport.preparerName,
      managerTitle: activeReport.managerTitle,
      managerName: activeReport.managerName,
    });
    setReports((current) => [report, ...current]);
    setActiveId(report.id);
    setActiveTab('details');
    setMobileListOpen(false);
    showToast('تم إنشاء تقرير جديد.');
  }

  function duplicateReport() {
    const now = new Date().toISOString();
    const duplicate: ProgramReport = {
      ...activeReport,
      id: makeId('report'),
      programName: activeReport.programName ? `${activeReport.programName} - نسخة` : 'نسخة من التقرير',
      images: activeReport.images.map((image) => ({ ...image, id: makeId('image') })),
      createdAt: now,
      updatedAt: now,
    };
    setReports((current) => [duplicate, ...current]);
    setActiveId(duplicate.id);
    setMobileListOpen(false);
    showToast('تم إنشاء نسخة من التقرير.');
  }

  function deleteReport() {
    if (reports.length === 1) {
      showToast('يجب إبقاء تقرير واحد على الأقل.');
      return;
    }
    if (!window.confirm('هل تريدين حذف التقرير الحالي نهائياً؟')) return;
    const remaining = reports.filter((report) => report.id !== activeReport.id);
    setReports(remaining);
    setActiveId(remaining[0].id);
    showToast('تم حذف التقرير.');
  }

  function resetReport() {
    if (!window.confirm('سيتم مسح بيانات التقرير الحالي مع إبقاء بيانات المدرسة والاعتماد. هل تريدين المتابعة؟')) return;
    const blank = createEmptyReport({
      id: activeReport.id,
      schoolName: activeReport.schoolName,
      educationOffice: activeReport.educationOffice,
      preparerTitle: activeReport.preparerTitle,
      preparerName: activeReport.preparerName,
      managerTitle: activeReport.managerTitle,
      managerName: activeReport.managerName,
      createdAt: activeReport.createdAt,
    });
    setReports((current) => current.map((report) => (report.id === activeReport.id ? blank : report)));
    setActiveTab('details');
    showToast('تم مسح حقول التقرير.');
  }

  function generateDraft() {
    if (!activeReport.programName.trim()) {
      showToast('اكتبي اسم البرنامج أولاً.');
      return;
    }
    setIsGenerating(true);
    window.setTimeout(() => {
      const draft = buildSmartDraft(activeReport.programName);
      updateActive({
        programField: activeReport.programField || draft.field,
        beneficiaries: activeReport.beneficiaries || draft.beneficiaries,
        beneficiaryCount: activeReport.beneficiaryCount || draft.beneficiaryCount,
        goals: draft.goals,
        steps: draft.steps,
        outcomes: draft.outcomes,
        recommendations: draft.recommendations,
      });
      setActiveTab('content');
      setIsGenerating(false);
      showToast('تم إنشاء مسودة ذكية محلية قابلة للتعديل.');
    }, 350);
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    const remainingSlots = MAX_IMAGES - activeReport.images.length;
    if (remainingSlots <= 0) {
      showToast('تم الوصول إلى الحد الأعلى: أربع صور.');
      return;
    }
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots);
    if (!selected.length) {
      showToast('اختاري ملفات صور صحيحة.');
      return;
    }

    showToast('جاري ضغط الصور وتجهيزها...');
    try {
      const encoded = await Promise.all(selected.map(compressImage));
      const newImages = encoded.map((dataUrl, index): EvidenceImage => ({
        id: makeId('image'),
        dataUrl,
        caption: `الشاهد المصور ${activeReport.images.length + index + 1}`,
      }));
      updateActive({ images: [...activeReport.images, ...newImages].slice(0, MAX_IMAGES) });
      showToast('تمت إضافة الصور وضغطها للحفظ الآمن.');
    } catch (error) {
      showToast(error instanceof Error && error.message === 'image-too-large'
        ? 'إحدى الصور أكبر من 12 ميجابايت.'
        : 'تعذر تجهيز إحدى الصور. جرّبي صورة أخرى.');
    }
  }

  function removeImage(id: string) {
    updateActive({ images: activeReport.images.filter((image) => image.id !== id) });
  }

  function updateImageCaption(id: string, caption: string) {
    updateActive({
      images: activeReport.images.map((image) => (image.id === id ? { ...image, caption } : image)),
    });
  }

  function exportBackup() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      reports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_للتقارير_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('تم تنزيل النسخة الاحتياطية.');
  }

  async function importBackup(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const source = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { reports?: unknown[] }).reports)
          ? (parsed as { reports: unknown[] }).reports
          : [];
      if (!source.length) throw new Error('invalid');
      const imported = source.map((item) => migrateReport(item));
      if (!window.confirm(`سيتم استيراد ${imported.length} تقريراً واستبدال التقارير الحالية. هل تريدين المتابعة؟`)) return;
      setReports(imported);
      setActiveId(imported[0].id);
      setActiveTab('details');
      showToast('تم استيراد النسخة الاحتياطية بنجاح.');
    } catch {
      showToast('ملف النسخة الاحتياطية غير صالح.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }

  async function exportPdf() {
    const element = document.getElementById('report-print-area');
    if (!element) return;
    setIsExporting(true);
    try {
      await document.fonts?.ready;
      element.classList.add('pdf-export-target');
      const { default: html2pdf } = await import('html2pdf.js');
      const pdfOptions = {
        margin: [6, 6, 6, 6],
        filename: `تقرير_${safeFileName(activeReport.programName)}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-break'] },
      };
      await html2pdf()
        .set(pdfOptions as never)
        .from(element)
        .save();
      showToast('تم تنزيل التقرير بصيغة PDF.');
    } catch {
      showToast('تعذر إنشاء PDF. استخدمي زر الطباعة ثم اختاري الحفظ بصيغة PDF.');
    } finally {
      element.classList.remove('pdf-export-target');
      setIsExporting(false);
    }
  }

  const saveLabel = saveState === 'saving'
    ? 'جاري الحفظ'
    : saveState === 'saved'
      ? 'محفوظ تلقائياً'
      : saveState === 'error'
        ? 'تعذر الحفظ'
        : 'جاهز';

  if (!loaded || !reports.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-teal" />
          <p className="mt-3 font-bold">جاري تشغيل المنصة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-slate-800">
      {toast && (
        <div className="no-print fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-center text-sm font-extrabold text-white shadow-2xl">
          {toast}
        </div>
      )}

      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-ink text-white shadow-lg">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-inner">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="شعار وزارة التعليم" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-white sm:text-xl">منصة تقارير البرامج المدرسية</h1>
              <p className="mt-0.5 hidden text-xs text-slate-300 sm:block">إنشاء وتوثيق وحفظ وطباعة التقارير بسهولة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold md:flex ${saveState === 'error' ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-slate-200'}`}>
              {saveState === 'saving' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saveLabel}
            </div>
            <button onClick={createReport} className="toolbar-button bg-gold text-ink hover:bg-amber-300">
              <FilePlus2 className="h-4 w-4" /><span className="hidden sm:inline">تقرير جديد</span>
            </button>
            <button onClick={() => window.print()} className="toolbar-button border border-white/20 hover:bg-white/10" title="طباعة">
              <Printer className="h-4 w-4" /><span className="hidden lg:inline">طباعة</span>
            </button>
            <button onClick={exportPdf} disabled={isExporting} className="toolbar-button border border-white/20 hover:bg-white/10 disabled:opacity-50" title="تنزيل PDF">
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              <span className="hidden lg:inline">PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="workspace mx-auto grid max-w-[1680px] grid-cols-1 gap-5 px-3 py-5 lg:grid-cols-[290px_minmax(420px,560px)_minmax(520px,1fr)] lg:px-5">
        <aside className={`no-print report-sidebar ${mobileListOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card-shell sticky top-24 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-teal" />
                <h2 className="font-black text-ink">التقارير المحفوظة</h2>
              </div>
              <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-black text-teal-dark">{reports.length}</span>
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="بحث في التقارير"
                className="field-control pr-9"
              />
            </label>

            <div className="mt-3 max-h-[48vh] space-y-2 overflow-y-auto pl-1">
              {filteredReports.length ? filteredReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => { setActiveId(report.id); setMobileListOpen(false); }}
                  className={`w-full rounded-xl border p-3 text-right transition ${report.id === activeReport.id ? 'border-teal bg-teal/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <p className="line-clamp-2 text-sm font-black text-ink">{report.programName || 'تقرير غير معنون'}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">{report.reportType}</p>
                  <p className="mt-2 text-[10px] text-slate-400">{formatUpdatedAt(report.updatedAt)}</p>
                </button>
              )) : (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">لا توجد نتائج مطابقة.</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button onClick={duplicateReport} className="secondary-button"><Copy className="h-4 w-4" /> نسخ</button>
              <button onClick={deleteReport} className="secondary-button text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> حذف</button>
              <button onClick={exportBackup} className="secondary-button"><Download className="h-4 w-4" /> تصدير</button>
              <button onClick={() => importRef.current?.click()} className="secondary-button"><ArchiveRestore className="h-4 w-4" /> استيراد</button>
              <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importBackup(event.target.files?.[0])} />
            </div>
          </div>
        </aside>

        <section className="no-print min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
            <button onClick={() => setMobileListOpen((value) => !value)} className="secondary-button bg-white shadow-sm">
              <Menu className="h-4 w-4" /> التقارير ({reports.length})
            </button>
            <span className="text-xs font-bold text-slate-500">{saveLabel}</span>
          </div>

          <div className="card-shell overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 pt-4">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition sm:text-sm ${activeTab === id ? 'bg-white text-teal-dark shadow-sm' : 'text-slate-500 hover:text-ink'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              {activeTab === 'details' && (
                <>
                  <div className="section-heading">
                    <div><p className="section-kicker">الخطوة الأولى</p><h2>بيانات المدرسة والبرنامج</h2></div>
                    <button onClick={resetReport} className="secondary-button"><RotateCcw className="h-4 w-4" /> مسح</button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="اسم المدرسة" value={activeReport.schoolName} onChange={(schoolName) => updateActive({ schoolName })} placeholder="مثال: المتوسطة الثالثة بجدة" className="sm:col-span-2" />
                    <Field label="مكتب أو إدارة التعليم" value={activeReport.educationOffice} onChange={(educationOffice) => updateActive({ educationOffice })} placeholder="مثال: إدارة تعليم جدة" className="sm:col-span-2" />
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-extrabold text-slate-600">نوع التقرير</span>
                      <select value={activeReport.reportType} onChange={(event) => updateActive({ reportType: event.target.value })} className="field-control">
                        {reportTypes.map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </label>
                    <Field label="اسم البرنامج" value={activeReport.programName} onChange={(programName) => updateActive({ programName })} placeholder="مثال: اليوم العالمي للغة العربية" className="sm:col-span-2" />
                    <Field label="مجال البرنامج" value={activeReport.programField} onChange={(programField) => updateActive({ programField })} placeholder="النشاط الثقافي" />
                    <Field label="تاريخ التنفيذ" value={activeReport.programDate} onChange={(programDate) => updateActive({ programDate })} placeholder="مثال: ١٤٤٨/٠١/٠١ هـ" />
                    <Field label="وقت التنفيذ" value={activeReport.programTime} onChange={(programTime) => updateActive({ programTime })} placeholder="مثال: ٩:٠٠ صباحاً" />
                    <Field label="المدة" value={activeReport.duration} onChange={(duration) => updateActive({ duration })} placeholder="مثال: ساعتان" />
                    <Field label="مكان التنفيذ" value={activeReport.location} onChange={(location) => updateActive({ location })} placeholder="المسرح المدرسي" />
                    <Field label="الجهة المنفذة" value={activeReport.executor} onChange={(executor) => updateActive({ executor })} placeholder="فريق النشاط الطلابي" />
                    <Field label="الفئة المستفيدة" value={activeReport.beneficiaries} onChange={(beneficiaries) => updateActive({ beneficiaries })} placeholder="طالبات المدرسة" />
                    <Field label="عدد المستفيدات" value={activeReport.beneficiaryCount} onChange={(beneficiaryCount) => updateActive({ beneficiaryCount })} placeholder="مثال: ١٢٠ مستفيدة" />
                  </div>

                  <button onClick={generateDraft} disabled={isGenerating} className="smart-button">
                    {isGenerating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    <span>{isGenerating ? 'جاري إعداد المسودة...' : 'إنشاء مسودة ذكية للأهداف والخطوات والنتائج'}</span>
                  </button>
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-800">
                    تعمل الصياغة محلياً داخل المتصفح دون إرسال البيانات أو مفاتيح سرية، ويمكنك تعديل النص الناتج بالكامل.
                  </p>
                </>
              )}

              {activeTab === 'content' && (
                <>
                  <div className="section-heading">
                    <div><p className="section-kicker">الخطوة الثانية</p><h2>المحتوى والنتائج</h2></div>
                    <button onClick={generateDraft} disabled={isGenerating} className="secondary-button text-teal-dark"><Sparkles className="h-4 w-4" /> إعادة الصياغة</button>
                  </div>
                  <TextAreaField label="أهداف البرنامج" value={activeReport.goals} onChange={(goals) => updateActive({ goals })} rows={7} helper="يفضل ٣–٥ أهداف" placeholder="اكتبي أهداف البرنامج، كل هدف في سطر مستقل." />
                  <TextAreaField label="خطوات التنفيذ" value={activeReport.steps} onChange={(steps) => updateActive({ steps })} rows={9} helper="بالترتيب الزمني" placeholder="اكتبي خطوات التخطيط والتنفيذ والتوثيق والتقويم." />
                  <TextAreaField label="النتائج ومؤشرات الأثر" value={activeReport.outcomes} onChange={(outcomes) => updateActive({ outcomes })} rows={6} placeholder="اكتبي النتائج التي تحققت ومؤشرات المشاركة أو التحسن." />
                  <TextAreaField label="التوصيات" value={activeReport.recommendations} onChange={(recommendations) => updateActive({ recommendations })} rows={5} placeholder="اكتبي توصيات تطوير البرنامج أو استدامته." />
                  <TextAreaField label="ملاحظات إضافية" value={activeReport.notes} onChange={(notes) => updateActive({ notes })} rows={4} placeholder="أي ملاحظات مهمة أو شكر للجهات الداعمة." />
                </>
              )}

              {activeTab === 'evidence' && (
                <>
                  <div className="section-heading">
                    <div><p className="section-kicker">الخطوة الثالثة</p><h2>الشواهد والاعتماد</h2></div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{activeReport.images.length}/{MAX_IMAGES} صور</span>
                  </div>

                  <label className="upload-zone">
                    <ImagePlus className="h-8 w-8 text-teal" />
                    <span className="font-black text-ink">إضافة صور الشواهد</span>
                    <span className="text-xs font-bold text-slate-500">تُضغط الصور تلقائياً لتقليل الحجم وتحسين الحفظ</span>
                    <input type="file" accept="image/*" multiple hidden onChange={(event) => void addImages(event.target.files)} />
                  </label>

                  {activeReport.images.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {activeReport.images.map((image, index) => (
                        <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          <div className="relative">
                            <img src={image.dataUrl} alt={image.caption || `شاهد ${index + 1}`} className="h-40 w-full object-cover" />
                            <button onClick={() => removeImage(image.id)} className="absolute left-2 top-2 rounded-full bg-black/65 p-2 text-white transition hover:bg-rose-600" title="حذف الصورة">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <input value={image.caption} onChange={(event) => updateImageCaption(image.id, event.target.value)} className="w-full border-0 bg-white px-3 py-2 text-xs font-bold outline-none" placeholder={`وصف الشاهد ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="mb-4 flex items-center gap-2 font-black text-ink"><BadgeCheck className="h-5 w-5 text-teal" /> بيانات الاعتماد</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="صفة معدة التقرير" value={activeReport.preparerTitle} onChange={(preparerTitle) => updateActive({ preparerTitle })} />
                      <Field label="اسم معدة التقرير" value={activeReport.preparerName} onChange={(preparerName) => updateActive({ preparerName })} />
                      <Field label="صفة قائدة المدرسة" value={activeReport.managerTitle} onChange={(managerTitle) => updateActive({ managerTitle })} />
                      <Field label="اسم قائدة المدرسة" value={activeReport.managerName} onChange={(managerName) => updateActive({ managerName })} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="preview-column min-w-0">
          <div className="no-print mb-3 flex items-center justify-between px-1 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-teal" /> المعاينة النهائية المباشرة</span>
            <span>مقاس A4</span>
          </div>

          <article id="report-print-area" className="report-paper mx-auto overflow-hidden bg-white shadow-soft ring-1 ring-slate-200">
            <div className="h-2.5 bg-gradient-to-l from-teal-dark via-teal to-sky-500" />
            <div className="report-content">
              <header className="avoid-break flex items-start justify-between gap-6 border-b-2 border-gold pb-5">
                <div className="pt-1">
                  <p className="text-[11px] font-black text-teal-dark">المملكة العربية السعودية</p>
                  <p className="mt-1 text-xs font-bold text-slate-600">وزارة التعليم</p>
                  {activeReport.educationOffice && <p className="mt-1 text-xs font-bold text-slate-500">{activeReport.educationOffice}</p>}
                  <p className="mt-2 text-sm font-black text-ink">{activeReport.schoolName || 'اسم المدرسة'}</p>
                </div>
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="شعار وزارة التعليم" className="h-24 w-36 object-contain" />
              </header>

              <section className="avoid-break py-7 text-center">
                <span className="inline-block rounded-full bg-teal/10 px-4 py-1.5 text-[11px] font-black text-teal-dark">{activeReport.reportType}</span>
                <h2 className="mt-4 text-2xl font-black leading-tight text-ink">{activeReport.programName || 'اسم البرنامج المدرسي'}</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">{activeReport.programField || 'مجال البرنامج'}</p>
              </section>

              <section className="avoid-break report-info-grid grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[
                  { icon: CalendarDays, title: 'التاريخ', value: activeReport.programDate },
                  { icon: MapPin, title: 'المكان', value: activeReport.location },
                  { icon: School, title: 'الجهة المنفذة', value: activeReport.executor },
                  { icon: Users, title: 'الفئة المستفيدة', value: activeReport.beneficiaries },
                  { icon: Hash, title: 'العدد', value: activeReport.beneficiaryCount },
                  { icon: CalendarDays, title: 'الوقت والمدة', value: [activeReport.programTime, activeReport.duration].filter(Boolean).join(' — ') },
                ].map(({ icon: Icon, title, value }) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black text-teal-dark"><Icon className="h-3.5 w-3.5" />{title}</div>
                    <p className="min-h-5 text-xs font-bold leading-5 text-slate-700">{value || '—'}</p>
                  </div>
                ))}
              </section>

              <div className="mt-5 space-y-4">
                <ReportSection icon={Target} title="أهداف البرنامج" text={activeReport.goals} placeholder="تُكتب أهداف البرنامج هنا." />
                <ReportSection icon={ClipboardList} title="خطوات التنفيذ" text={activeReport.steps} placeholder="تُكتب خطوات تنفيذ البرنامج هنا." />
                {(activeReport.outcomes || activeReport.recommendations) && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportSection icon={BadgeCheck} title="النتائج ومؤشرات الأثر" text={activeReport.outcomes} placeholder="تُكتب النتائج هنا." compact />
                    <ReportSection icon={Lightbulb} title="التوصيات" text={activeReport.recommendations} placeholder="تُكتب التوصيات هنا." compact />
                  </div>
                )}
              </div>

              {activeReport.images.length > 0 && (
                <section className="report-section mt-5">
                  <h3 className="report-section-title"><ImagePlus className="h-4 w-4 text-gold" /> الشواهد المصورة</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {activeReport.images.map((image, index) => (
                      <figure key={image.id} className="avoid-break overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                        <img src={image.dataUrl} alt={image.caption || `شاهد ${index + 1}`} className="h-40 w-full rounded-lg object-cover" />
                        <figcaption className="px-1 pb-1 pt-2 text-center text-[10px] font-bold text-slate-600">{image.caption || `الشاهد المصور ${index + 1}`}</figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              {activeReport.notes && (
                <section className="avoid-break mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="mb-2 text-xs font-black text-amber-900">ملاحظات إضافية</h3>
                  <p className="whitespace-pre-line text-xs leading-6 text-amber-950/80">{activeReport.notes}</p>
                </section>
              )}

              <section className="avoid-break mt-7 grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 text-center text-xs">
                <div>
                  <p className="font-black text-ink">{activeReport.preparerTitle || 'معدة التقرير'}</p>
                  <p className="mt-3 min-h-5 font-bold text-slate-600">{activeReport.preparerName || '................................'}</p>
                  <p className="mt-5 text-[10px] text-slate-400">التوقيع</p>
                </div>
                <div>
                  <p className="font-black text-ink">{activeReport.managerTitle || 'مديرة المدرسة'}</p>
                  <p className="mt-3 min-h-5 font-bold text-slate-600">{activeReport.managerName || '................................'}</p>
                  <p className="mt-5 text-[10px] text-slate-400">التوقيع والختم</p>
                </div>
              </section>

              <footer className="avoid-break mt-7 flex items-center justify-between border-t border-slate-100 pt-3 text-[9px] font-bold text-slate-400">
                <span>منصة تقارير البرامج المدرسية</span>
                <span>تاريخ إعداد التقرير: {todayHijri()}</span>
              </footer>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

interface ReportSectionProps {
  icon: typeof Target;
  title: string;
  text: string;
  placeholder: string;
  compact?: boolean;
}

function ReportSection({ icon: Icon, title, text, placeholder, compact = false }: ReportSectionProps) {
  return (
    <section className="report-section">
      <h3 className="report-section-title"><Icon className="h-4 w-4 text-gold" /> {title}</h3>
      <p className={`whitespace-pre-line text-slate-700 ${compact ? 'text-xs leading-6' : 'text-[13px] leading-7'}`}>{text || placeholder}</p>
    </section>
  );
}
