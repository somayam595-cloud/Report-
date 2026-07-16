import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Printer, 
  FileText, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Save, 
  School, 
  Calendar, 
  Users, 
  Hash, 
  Bookmark, 
  FileDown, 
  FileUp, 
  Image as ImageIcon,
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  X,
  Upload,
  Clock,
  ExternalLink,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProgramReport, GenerationResponse } from "./types";
// @ts-ignore
import html2pdf from "html2pdf.js";

// Default template for the first load to make the app look stunning immediately
const DEFAULT_REPORT: ProgramReport = {
  id: "default-saudi-arabic-day",
  schoolName: "مدرسة جيل المستقبل الأهلية",
  programName: "اليوم العالمي للغة العربية",
  programField: "",
  reportType: "تقرير برنامج ثقافي",
  progDate: "٠٩ / ٠٦ / ١٤٤٨ هـ",
  progExec: "جماعة اللغة العربية",
  progBene: "جميع طلاب ومنسوبي المدرسة",
  progCount: "أكثر من 350 مستفيداً",
  goals: "1. تعزيز الهوية الوطنية والاعتزاز باللغة العربية كوعاء للحضارة والثقافة الإسلامية.\n2. إبراز جماليات الخط العربي وفنونه الإبداعية لدى الأجيال الناشئة.\n3. تنمية المهارات اللغوية والأدبية لدى الطلاب وتدريبهم على الخطابة والإلقاء الفصيح.\n4. تفعيل الشراكة التعليمية والمجتمعية من خلال الأنشطة والمسابقات الثقافية المصاحبة.",
  steps: "1. عقد اجتماع تحضيري برئاسة قائد المدرسة لتشكيل اللجان الفنية والتنظيمية وتوزيع المهام.\n2. الإعلان عن المناسبة وتفاصيل المسابقات والأركان المصاحبة عبر الإذاعة المدرسية وحسابات المدرسة.\n3. تخصيص الإذاعة المدرسية وحصص النشاط الصباحية للحديث عن منجزات لغة الضاد وإرثها العظيم.\n4. إقامة معرض فني تفاعلي للخط العربي يتضمن لوحات ومجسمات من تصميم وإنتاج طلاب المدرسة.\n5. تنفيذ مسابقة الخطيب الصغير وتصفية المشاركات الطلابية لاختيار المراكز الثلاثة الأولى.\n6. إقامة الحفل الختامي بمسرح المدرسة لتكريم الطلاب الفائزين وتوزيع شهادات التقدير والجوائز العينية.",
  images: [],
  createdAt: new Date().toISOString(),
  preparerTitle: "معدة التقرير",
  preparerName: "",
  managerTitle: "مديرة المدرسة",
  managerName: ""
};

// Helper to clean any Hijri date string to ensure it ends with exactly one "هـ"
const cleanHijriDate = (dateStr: string): string => {
  if (!dateStr) return "";
  let cleaned = dateStr
    .replace(/هـ/g, '')
    .replace(/ه/g, '')
    .replace(/AH/g, '')
    .replace(/A\.H\./g, '')
    .trim();
  
  // Clean any trailing slashes or spaces
  cleaned = cleaned.replace(/[\/\s\-]+$/, '').trim();
  
  return `${cleaned} هـ`;
};

// Helper to get today's Hijri date dynamically
const getTodayHijri = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formatted = formatter.format(new Date());
    return cleanHijriDate(formatted);
  } catch (e) {
    return "١٤٤٨/٠١/٢٣ هـ";
  }
};

const LOADING_MESSAGES = [
  "جاري صياغة الأهداف التربوية بما يتوافق مع معايير وزارة التعليم...",
  "جاري ابتكار خطوات تنفيذ إجرائية وعملية للمبادرة...",
  "جاري تحليل مسمى البرنامج لاقتراح المجال والمستهدفين بدقة...",
  "جاري تنسيق عناصر التقرير في قالب رسمي جاهز للطباعة...",
  "ثوانٍ معدودة ويصبح تقريرك الذكي جاهزاً..."
];

const REPORT_NAMES_BY_TYPE: Record<string, string[]> = {
  "تقرير نشاط مدرسي عام": [
    "اليوم الوطني السعودي",
    "يوم التأسيس السعودي",
    "يوم العلم السعودي",
    "الإذاعة المدرسية المميزة",
    "اليوم العالمي للغذاء الصحي",
    "حفل استقبال الطلاب المستجدين",
    "خطة الإخلاء الافتراضية للسلامة",
    "الجمعية العمومية لأولياء الأمور",
    "اجتماع الجمعية العمومية الدوري",
    "برنامج التوعية المرورية (سلامتك)",
    "زيارة ميدانية تعليمية خارجية"
  ],
  "تقرير برنامج ثقافي": [
    "اليوم العالمي للغة العربية",
    "اليوم العالمي للمعلم",
    "مسابقة القرآن الكريم والسنة النبوية",
    "مسابقة الإلقاء والخطابة المدرسية",
    "مشروع تحدي القراءة العربي",
    "مهرجان المسرح المدرسي والنشاط الثقافي",
    "مسابقة الخط العربي والزخرفة الإسلامية",
    "برنامج وطني هويتي الثقافي"
  ],
  "تقرير برنامج اجتماعي": [
    "اليوم العالمي للعمل الإنساني",
    "برنامج رفق لخفض العنف المدرسي",
    "زيارة دار الرعاية الاجتماعية والمسنين",
    "برنامج التكافل الاجتماعي (الحقيبة المدرسية)",
    "برنامج بر الوالدين والإحسان إليهما",
    "يوم اليتيم العربي",
    "برنامج التآخي والوئام وبناء الصداقات"
  ],
  "تقرير برنامج علمي": [
    "معرض العلوم والابتكار والذكاء الاصطناعي",
    "مسابقة موهوب العلوم والرياضيات والفيزياء",
    "برنامج الروبوت التعليمي والبرمجة",
    "اليوم العالمي للبيئة وحمايتها",
    "برنامج الفلك الصغير ومراقبة الكواكب",
    "تفعيل أسبوع الفضاء العالمي",
    "النادي العلمي المدرسي للابتكارات"
  ],
  "تقرير برنامج رياضي": [
    "دوري المدرسة الرياضي لكرة القدم",
    "اليوم الرياضي المدرسي المفتوح",
    "بطولة تنس الطاولة والألعاب الفردية",
    "برنامج العقل السليم في الجسم السليم",
    "ماراثون الجري المدرسي السنوي",
    "أسبوع اللياقة البدنية والنشاط الصحي"
  ],
  "تقرير برنامج توعوي وإرشاد طلابي": [
    "برنامج التهيئة الإرشادية للطلاب الجدد",
    "التوعية بأضرار المخدرات والتدخين والمؤثرات العقلية",
    "برنامج الحد من الغياب والانضباط المدرسي",
    "التوعية الصحية بمرض السكري وطرق الوقاية",
    "مخاطر التنمر الإلكتروني وطرق علاجه والحد منه",
    "خطة الإرشاد المهني والتعليمي للمستقبل",
    "تفعيل خط مساندة الطفل والتوعية بحقوقه"
  ],
  "تقرير ورشة عمل / تدريب": [
    "ورشة عمل تطوير مهارات المعلمين في التدريس النشط",
    "دورة استخدام المنصات التعليمية الرقمية والذكاء الاصطناعي",
    "ورشة التخطيط للدروس النموذجية وتحسين مخرجات التعلم",
    "دورة تدريبية للطلاب على اختبارات القدرات والتحصيلي",
    "ورشة الأمن والسلامة المدرسية في المنشأة",
    "ورشة عمل طرق التدريس الحديثة للمرحلة الابتدائية"
  ],
  "تقرير فعاليات ومناسبات وطنية": [
    "الاحتفاء باليوم الوطني السعودي المبارك",
    "الاحتفاء بيوم التأسيس السعودي المجيد",
    "الاحتفاء بيوم العلم السعودي ورفع الراية",
    "تفعيل ذكرى البيعة المباركة لخادم الحرمين الشريفين"
  ],
  "تقرير إداري": [
    "تقرير مؤشرات الأداء المدرسي والانضباط والتحصيل الدراسي",
    "تقرير الانضباط المدرسي السنوي وخطة معالجة الغياب",
    "تقرير الصيانة الدورية والمرافق المدرسية والسلامة",
    "تقرير أعمال اللجان المدرسية والفرق التربوية",
    "تقرير الاختبارات النهائية الفصلي ومستوى التحصيل"
  ],
  "تقرير مبادرة تطوعية": [
    "مبادرة تشجير فناء المدرسة والمحيط الخارجي",
    "مبادرة تنظيف وصيانة المسجد المجاور للمدرسة",
    "مبادرة التبرع بالكتب المدرسية المستعملة والمراجع",
    "مبادرة كسوة الشتاء والرحمة لعمالة النظافة",
    "مبادرة تنظيم السير المروري أمام بوابة المدرسة"
  ],
  "تقرير اجتماع مجلس المدرسة": [
    "اجتماع مجلس أولياء الأمور والمعلمين الأول للعام الدراسي",
    "اجتماع مجلس المدرسة الطارئ لمناقشة الخطط والبرامج",
    "اجتماع مجلس التوجيه والإرشاد والتحصيل الدراسي",
    "اجتماع الهيئة التعليمية والإدارية الدوري الأول"
  ]
};

export default function App() {
  // Persistence states
  const [reports, setReports] = useState<ProgramReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string>("");
  const [schoolNameGlobal, setSchoolNameGlobal] = useState<string>("");
  const [schoolLogo, setSchoolLogo] = useState<string>("");

  // UI state managers
  const [activeTab, setActiveTab] = useState<"info" | "goals" | "images">("info");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPdfInstructions, setShowPdfInstructions] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reports and configurations from LocalStorage
  useEffect(() => {
    const savedReports = localStorage.getItem("moe_reports");
    const savedSchool = localStorage.getItem("moe_school_name");
    const savedLogo = localStorage.getItem("moe_school_logo");
    
    if (savedSchool) {
      setSchoolNameGlobal(savedSchool);
    } else {
      setSchoolNameGlobal("مدرسة جيل المستقبل الأهلية");
    }

    if (savedLogo) {
      setSchoolLogo(savedLogo);
    }

    if (savedReports) {
      try {
        const parsed = JSON.parse(savedReports) as ProgramReport[];
        if (parsed.length > 0) {
          const cleanedReports = parsed.map(r => ({
            ...r,
            progDate: cleanHijriDate(r.progDate)
          }));
          setReports(cleanedReports);
          setActiveReportId(cleanedReports[0].id);
        } else {
          // Initialize with default
          const initial = { ...DEFAULT_REPORT, schoolName: savedSchool || DEFAULT_REPORT.schoolName };
          setReports([initial]);
          setActiveReportId(initial.id);
        }
      } catch (e) {
        const initial = { ...DEFAULT_REPORT, schoolName: savedSchool || DEFAULT_REPORT.schoolName };
        setReports([initial]);
        setActiveReportId(initial.id);
      }
    } else {
      const initial = { ...DEFAULT_REPORT, schoolName: savedSchool || DEFAULT_REPORT.schoolName };
      setReports([initial]);
      setActiveReportId(initial.id);
    }
  }, []);

  // Auto-print if query parameter ?print=true is present (useful for printing from iframes by launching a new tab)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("print") === "true") {
      const timer = setTimeout(() => {
        window.print();
        // Remove print parameter from URL smoothly
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync state back to LocalStorage
  const saveReportsToStorage = (newReports: ProgramReport[]) => {
    setReports(newReports);
    localStorage.setItem("moe_reports", JSON.stringify(newReports));
  };

  const handleGlobalSchoolNameChange = (val: string) => {
    setSchoolNameGlobal(val);
    localStorage.setItem("moe_school_name", val);
    
    // Also update current active report
    const updated = reports.map(r => {
      if (r.id === activeReportId) {
        return { ...r, schoolName: val };
      }
      return r;
    });
    saveReportsToStorage(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSchoolLogo(base64String);
        localStorage.setItem("moe_school_logo", base64String);
        showToast("success", "تم رفع وتحديث شعار المدرسة بنجاح!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setSchoolLogo("");
    localStorage.removeItem("moe_school_logo");
    showToast("success", "تمت استعادة الشعار الافتراضي.");
  };

  const activeReport = reports.find(r => r.id === activeReportId) || {
    ...DEFAULT_REPORT,
    schoolName: schoolNameGlobal
  };

  // Calculate completion percentage for document status card
  const completedFieldsCount = [
    activeReport.programName,
    activeReport.progDate,
    activeReport.progExec,
    activeReport.progBene,
    activeReport.progCount,
    activeReport.goals,
    activeReport.steps
  ].filter(val => val && val.trim() !== "").length;
  const imagePresent = activeReport.images && activeReport.images.length > 0 ? 1 : 0;
  const completionPercentage = Math.round(((completedFieldsCount + imagePresent) / 8) * 100);

  const updateActiveReport = (updates: Partial<ProgramReport>) => {
    const updated = reports.map(r => {
      if (r.id === activeReportId) {
        return { ...r, ...updates };
      }
      return r;
    });
    saveReportsToStorage(updated);
  };

  // Rotating messages during AI generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3500);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Show Toast helper
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Real AI Generation function calling Express route
  const handleAIGenerate = async () => {
    const name = activeReport.programName.trim();
    
    if (!name) {
      showToast("error", "يرجى إدخال اسم البرنامج أولاً في تبويب بطاقة البرنامج.");
      setActiveTab("info");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programName: name, programField: "" }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل الاتصال بالخادم لتوليد البيانات.");
      }

      const data = (await response.json()) as GenerationResponse;
      
      updateActiveReport({
        goals: data.goals || activeReport.goals,
        steps: data.steps || activeReport.steps,
        progBene: data.beneficiaries || activeReport.progBene,
        progCount: data.count || activeReport.progCount,
      });

      if (data.isFallback) {
        showToast("success", "تم صياغة التقرير بمسودة نموذجية ذكية محلياً بنجاح (نظراً للوصول للحد اليومي للاستخدام). يمكنك تعديلها بحرية!");
      } else {
        showToast("success", "تم صياغة التقرير بذكاء واحترافية بواسطة الذكاء الاصطناعي!");
      }
      setActiveTab("goals"); // Switch to goals tab so they can view the output
    } catch (err: any) {
      console.error(err);
      showToast("error", err.message || "حدث خطأ غير متوقع أثناء توليد التقرير الذكي.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Local storage multiple template handlers
  const handleAddNewReport = () => {
    const newReport: ProgramReport = {
      id: `report-${Date.now()}`,
      schoolName: schoolNameGlobal,
      programName: "",
      programField: "",
      reportType: "تقرير نشاط مدرسي عام",
      progDate: getTodayHijri(),
      progExec: "",
      progBene: "",
      progCount: "",
      goals: "",
      steps: "",
      images: [],
      createdAt: new Date().toISOString()
    };
    const newList = [newReport, ...reports];
    saveReportsToStorage(newList);
    setActiveReportId(newReport.id);
    setActiveTab("info");
    showToast("success", "تم إنشاء مسودة تقرير جديدة بنجاح.");
  };

  const handleDeleteReport = (id: string, name: string) => {
    if (reports.length <= 1) {
      showToast("error", "يجب الاحتفاظ بمسودة تقرير واحدة على الأقل في القائمة.");
      return;
    }
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف مسودة التقرير: "${name || "تقرير غير معنون"}"؟`);
    if (!confirmDelete) return;

    const newList = reports.filter(r => r.id !== id);
    saveReportsToStorage(newList);
    
    if (activeReportId === id) {
      setActiveReportId(newList[0].id);
    }
    showToast("success", "تم حذف مسودة التقرير بنجاح.");
  };

  const handleClearCurrentForm = () => {
    const confirmClear = window.confirm("هل أنت متأكد من مسح جميع بيانات الحقول للتقرير الحالي؟");
    if (!confirmClear) return;

    updateActiveReport({
      programName: "",
      programField: "",
      progDate: "",
      progExec: "",
      progBene: "",
      progCount: "",
      goals: "",
      steps: "",
      images: []
    });
    showToast("success", "تم مسح بيانات التقرير الحالي.");
  };

  // Image Upload System (supports multiple and caps at 4)
  const processFiles = (files: File[]) => {
    const availableSlots = 4 - activeReport.images.length;
    if (availableSlots <= 0) {
      showToast("error", "لقد قمت برفع الحد الأقصى للشواهد وهو 4 صور.");
      return;
    }

    const filesToLoad = files.slice(0, availableSlots);
    let loadedImages = [...activeReport.images];
    let counter = 0;

    filesToLoad.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        showToast("error", "نوع الملف غير صالح، يرجى رفع ملفات صور فقط.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          loadedImages.push(e.target.result as string);
        }
        counter++;
        if (counter === filesToLoad.length) {
          updateActiveReport({ images: loadedImages });
          showToast("success", `تم رفع ${filesToLoad.length} من صور الشواهد بنجاح.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const filtered = activeReport.images.filter((_, idx) => idx !== indexToRemove);
    updateActiveReport({ images: filtered });
    showToast("success", "تم إزالة صورة الشاهد.");
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("report-print-area");
    if (!element) {
      showToast("error", "لم يتم العثور على منطقة الطباعة.");
      return;
    }

    setIsExportingPdf(true);
    showToast("success", "جاري تحويل وتحميل التقرير كملف PDF...");

    // Helper functions for parsing and converting oklch/oklab to standard rgb/rgba
    const parseVal = (valStr: string): number => {
      valStr = valStr.trim();
      if (valStr.endsWith("%")) {
        return parseFloat(valStr) / 100;
      }
      return parseFloat(valStr);
    };

    const oklabToRgb = (L: number, a: number, bVal: number, alpha: number = 1): string => {
      const l_ = L + 0.3963377774 * a + 0.2158037573 * bVal;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * bVal;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * bVal;

      const l_lin = l_ * l_ * l_;
      const m_lin = m_ * m_ * m_;
      const s_lin = s_ * s_ * s_;

      const r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
      const g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
      const b_lin = -0.0041960863 * l_lin - 0.7034186145 * m_lin + 1.7076147010 * s_lin;

      const gamma = (x: number) => {
        return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };

      const r = Math.max(0, Math.min(255, Math.round(gamma(r_lin) * 255)));
      const g = Math.max(0, Math.min(255, Math.round(gamma(g_lin) * 255)));
      const b = Math.max(0, Math.min(255, Math.round(gamma(b_lin) * 255)));

      return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const oklchToRgb = (L: number, c: number, h: number, alpha: number = 1): string => {
      const hRad = (h * Math.PI) / 180;
      const a = c * Math.cos(hRad);
      const b = c * Math.sin(hRad);
      return oklabToRgb(L, a, b, alpha);
    };

    const cleanColorFunctions = (cssText: string): string => {
      let result = "";
      let i = 0;
      while (i < cssText.length) {
        if (cssText.startsWith("oklch(", i) || cssText.startsWith("oklab(", i)) {
          const isOklch = cssText.startsWith("oklch(", i);
          const startIdx = i;
          i += 6;
          let parenCount = 1;
          let content = "";
          while (i < cssText.length && parenCount > 0) {
            const char = cssText[i];
            if (char === "(") parenCount++;
            else if (char === ")") parenCount--;
            
            if (parenCount > 0) {
              content += char;
            }
            i++;
          }
          try {
            const parts = content.split("/");
            const colorParts = parts[0].trim().split(/\s+/);
            if (colorParts.length >= 3) {
              const L = parseVal(colorParts[0]);
              const second = parseVal(colorParts[1]);
              const third = parseVal(colorParts[2]);
              
              let alpha = 1;
              if (parts[1]) {
                const alphaPart = parts[1].trim();
                if (alphaPart.includes("var(")) {
                  alpha = 1;
                } else {
                  alpha = parseVal(alphaPart);
                  if (isNaN(alpha)) alpha = 1;
                }
              }
              
              let rgbStr = "rgb(0,0,0)";
              if (isOklch) {
                rgbStr = oklchToRgb(isNaN(L) ? 0.5 : L, isNaN(second) ? 0 : second, isNaN(third) ? 0 : third, alpha);
              } else {
                rgbStr = oklabToRgb(isNaN(L) ? 0.5 : L, isNaN(second) ? 0 : second, isNaN(third) ? 0 : third, alpha);
              }
              result += rgbStr;
            } else {
              result += "rgb(14, 116, 144)";
            }
          } catch (err) {
            result += "rgb(14, 116, 144)";
          }
        } else {
          result += cssText[i];
          i++;
        }
      }
      return result;
    };

    // Extract all styles from style tags AND link stylesheets
    const cssTexts: string[] = [];
    const stylesheets = Array.from(document.styleSheets);

    for (const sheet of stylesheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          const sheetText = Array.from(rules).map(r => r.cssText).join("\n");
          cssTexts.push(sheetText);
        }
      } catch (e) {
        // Fallback for CORS or external stylesheets: try fetching
        if (sheet.href) {
          try {
            const res = await fetch(sheet.href);
            const text = await res.text();
            cssTexts.push(text);
          } catch (fetchErr) {
            console.warn("Could not fetch external stylesheet:", sheet.href, fetchErr);
          }
        }
      }
    }

    // Process and clean all CSS text
    const combinedCss = cssTexts.join("\n");
    const cleanedCss = cleanColorFunctions(combinedCss);

    // Create a temporary stylesheet with the cleaned rules
    const tempStyleEl = document.createElement("style");
    tempStyleEl.id = "pdf-temp-style-clean";
    tempStyleEl.innerHTML = cleanedCss;
    document.head.appendChild(tempStyleEl);

    // Intercept getComputedStyle to prevent html2canvas from reading native oklch or oklab values
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === 'getPropertyValue') {
            return (propertyName: string) => {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                return cleanColorFunctions(val);
              }
              return val;
            };
          }
          const val = Reflect.get(target, prop, receiver);
          if (typeof val === 'function') {
            return val.bind(target);
          }
          if (typeof prop === 'string' && typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return cleanColorFunctions(val);
          }
          return val;
        }
      });
    };

    // Disable all original stylesheets to prevent browser/html2canvas from reading them
    const disabledStates: { sheet: CSSStyleSheet; wasDisabled: boolean }[] = [];
    stylesheets.forEach(sheet => {
      try {
        disabledStates.push({ sheet, wasDisabled: sheet.disabled });
        sheet.disabled = true;
      } catch (err) {
        console.warn("Failed to disable stylesheet:", err);
      }
    });

    const opt = {
      margin:       0.1, // small margin to prevent cutting edges
      filename:     `تقرير_${(activeReport.programName || "برنامج_مدرسي").trim()}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF:        { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    const restoreStyles = () => {
      window.getComputedStyle = originalGetComputedStyle;
      const el = document.getElementById("pdf-temp-style-clean");
      if (el) el.remove();
      disabledStates.forEach(({ sheet, wasDisabled }) => {
        try {
          sheet.disabled = wasDisabled;
        } catch (err) {
          console.warn("Failed to restore stylesheet:", err);
        }
      });
    };

    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        setIsExportingPdf(false);
        showToast("success", "تم تحميل ملف PDF بنجاح!");
        restoreStyles();
      })
      .catch((err: any) => {
        console.error("PDF generation error:", err);
        setIsExportingPdf(false);
        showToast("error", "حدث خطأ أثناء حفظ ملف PDF.");
        restoreStyles();
      });
  };

  // Backups export/import system
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reports, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `نسخة_احتياطية_تقارير_سمسم_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("success", "تم تصدير ملف النسخة الاحتياطية بنجاح.");
    } catch (e) {
      showToast("error", "فشل تصدير النسخة الاحتياطية.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as ProgramReport[];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          // Merge or overwrite list
          const confirmImport = window.confirm(`تم العثور على ${parsed.length} تقارير في الملف. هل تريد دمجها مع التقارير الحالية؟ (إلغاء الأمر سيؤدي لاستبدالها بالكامل)`);
          
          let newList = [];
          if (confirmImport) {
            newList = [...parsed, ...reports.filter(r => !parsed.some(p => p.id === r.id))];
          } else {
            newList = parsed;
          }
          
          saveReportsToStorage(newList);
          setActiveReportId(newList[0].id);
          showToast("success", "تم استيراد تقارير النسخة الاحتياطية بنجاح!");
        } else {
          showToast("error", "تنسيق ملف النسخة الاحتياطية غير صالح.");
        }
      } catch (error) {
        showToast("error", "حدث خطأ أثناء قراءة وتحليل ملف النسخة الاحتياطية.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="min-h-screen bg-off-white text-[#1e293b] font-sans leading-relaxed selection:bg-gold selection:text-deep">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 left-6 md:right-auto md:left-6 z-50 max-w-md no-print"
          >
            <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === "success" 
                ? "bg-emerald-500/95 text-white border-emerald-400" 
                : "bg-rose-500/95 text-white border-rose-400"
            }`}>
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {toast.type === "success" ? "تم بنجاح" : "تنبيه خطأ"}
                </p>
                <p className="text-xs mt-1 text-white/90 leading-normal">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="mr-auto text-white/70 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Generation Guide Modal */}
      <AnimatePresence>
        {showPdfInstructions && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 text-right overflow-hidden relative"
            >
              <div className="absolute top-4 left-4">
                <button 
                  onClick={() => setShowPdfInstructions(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="w-10 h-10 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center text-[#c9a84c]">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0a1628]">تعليمات طباعة التقرير وحفظه كـ PDF</h3>
                  <p className="text-xs text-slate-400">للحصول على مستند رسمي عالي الجودة ومتطابق مع معايير الوزارة</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                <p className="font-medium text-slate-800">عند الضغط على زر الطباعة أو حفظ PDF، ستفتح لك نافذة الطباعة الخاصة بمتصفحك. يرجى التأكد من ضبط الخيارات التالية:</p>
                
                <ul className="space-y-3 pr-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                    <p><strong>الوجهة (Destination):</strong> اختر <span className="text-[#0e7490] font-bold">الحفظ بتنسيق PDF (Save as PDF)</span> أو طابعتك المفضلة.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                    <p><strong>تخطيط الصفحة (Layout):</strong> يجب اختيار <span className="text-[#0e7490] font-bold">رأسي (Portrait)</span>.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                    <p><strong>حجم الورق (Paper Size):</strong> تأكد من اختيار <span className="text-[#0e7490] font-bold">A4</span>.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">4</span>
                    <p><strong>الخيارات الإضافية (More Settings):</strong></p>
                  </li>
                </ul>

                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 mr-6 space-y-2 text-xs text-amber-900">
                  <p className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-[#c9a84c]" />
                    ملاحظة هامة جداً لظهور الصور والخطوط الملونة:
                  </p>
                  <p>تأكد من تفعيل خيار <span className="font-bold underline">"رسومات الخلفية" (Background graphics)</span> وإلغاء خيار <span className="font-bold underline">"الرؤوس والتذييلات" (Headers and footers)</span> لضمان إخراج التقرير في ورقة واحدة أنيقة وخالية من الروابط العشوائية.</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-emerald-900 mt-2">
                  <p className="flex items-center gap-1.5 font-bold">
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    تلميح لحل مشاكل الطباعة في بيئة التطوير (iFrame):
                  </p>
                  <p>إذا كنت تواجه مشكلة في الطباعة داخل هذا الإطار، يُنصح بالضغط على زر <strong>"فتح في صفحة مستقلة"</strong> أدناه لفتح التطبيق في نافذة كاملة للطباعة المباشرة، أو استخدام زر <strong>"حفظ PDF"</strong> المباشر في لوحة التحكم للتحميل الفوري كملف.</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button 
                  onClick={() => setShowPdfInstructions(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                
                <a 
                  href={window.location.href}
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => setShowPdfInstructions(false)}
                  className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح في صفحة مستقلة
                </a>

                <button 
                  onClick={() => {
                    setShowPdfInstructions(false);
                    const isInIframe = window.self !== window.top;
                    if (isInIframe) {
                      const printUrl = window.location.href + (window.location.href.includes("?") ? "&" : "?") + "print=true";
                      window.open(printUrl, "_blank");
                    } else {
                      setTimeout(() => window.print(), 300);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#0a1628] to-[#0e7490] rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  متابعة وطباعة الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Interactive App Container */}
      <div className="max-w-[1550px] mx-auto px-4 py-6 md:py-8 grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
        
        {/* RIGHT COLUMN: Sidebar and Form Settings (No-Print) */}
        <div className="xl:col-span-5 flex flex-col gap-5 no-print">
          
          {/* Platform Main Header Panel */}
          <div className="bg-gradient-to-br from-deep to-navy rounded-[16px] shadow-[0_10px_25px_rgba(10,22,40,0.15)] p-6 border-b-4 border-gold relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-teal/20 to-transparent rounded-br-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-gold/5 to-transparent rounded-tl-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-11 h-11 bg-gradient-to-tr from-gold to-gold-light rounded-xl flex items-center justify-center text-deep shadow-md shadow-black/30 shrink-0">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h1 className="font-sans text-[20px] font-extrabold tracking-tight text-gold-light leading-snug">
                    منصة تقارير البرامج المدرسية
                  </h1>
                  <p className="text-[11px] text-slate-300 font-medium tracking-wide">
                    وزارة التعليم — المملكة العربية السعودية
                  </p>
                </div>
              </div>
              
              <div className="bg-white/10 border border-gold/60 py-1.5 px-3.5 rounded-full flex items-center gap-1.5 font-semibold text-[11px] text-gold-light self-start sm:self-auto">
                <span>🏫</span>
                <span>{schoolNameGlobal || "مدرسة الملك فيصل الثانوية"}</span>
              </div>
            </div>

            {/* School name persistent input box */}
            <div className="mt-4 pt-3.5 border-t border-slate-700/60 relative z-10">
              <label className="text-[10px] uppercase font-bold text-gold tracking-wider block mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                اسم المدرسة التابع لها (يُحفظ تلقائياً)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={schoolNameGlobal}
                  onChange={(e) => handleGlobalSchoolNameChange(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 hover:border-slate-600 focus:border-teal focus:ring-2 focus:ring-teal/20 text-white rounded-xl py-2 px-3 text-sm font-semibold outline-none transition-all placeholder:text-slate-500 text-right"
                  placeholder="أدخل اسم المدرسة هنا..."
                />
              </div>
            </div>

            {/* School logo persistent upload box */}
            <div className="mt-4 pt-3.5 border-t border-slate-700/60 relative z-10 flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-gold tracking-wider block flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gold" />
                شعار المدرسة المخصص (اختياري)
              </label>
              
              <div className="flex items-center gap-3 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                {/* Logo Preview */}
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-slate-600">
                  {schoolLogo ? (
                    <img 
                      src={schoolLogo} 
                      alt="الشعار الحالي" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-400 text-[10px] text-center leading-tight p-1 font-semibold">
                      لا يوجد شعار
                    </div>
                  )}
                </div>
                
                {/* Logo controls */}
                <div className="flex-1 flex flex-col gap-1.5 text-right">
                  <div className="flex items-center gap-2">
                    <label className="bg-teal hover:bg-teal-light text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all">
                      رفع شعار مدرسة
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                    
                    {schoolLogo && (
                      <button 
                        onClick={handleResetLogo}
                        className="text-rose-400 hover:text-rose-300 text-[11px] font-bold py-1 px-2 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 transition-all"
                      >
                        حذف الشعار
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    شعار وزارة التعليم الرسمي مدمج تلقائياً في المنتصف بشكل دائم. يمكنك اختيار شعار مخصص لمدرستك ليظهر في يمين الترويسة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Panel: Saved Drafts Lists */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4.5 h-4.5 text-teal" />
                <h3 className="font-bold text-sm text-navy">مسودات التقارير المحفوظة</h3>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {reports.length}
                </span>
              </div>
              <button 
                onClick={handleAddNewReport}
                className="text-xs font-bold text-teal hover:text-deep flex items-center gap-1 bg-teal/5 hover:bg-teal/10 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                تقرير جديد
              </button>
            </div>

            {/* Scrollable reports list */}
            <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 custom-scroll">
              {reports.map((report) => {
                const isActive = report.id === activeReportId;
                return (
                  <div 
                    key={report.id}
                    onClick={() => {
                      setActiveReportId(report.id);
                      // Set global school name if report has different
                      if (report.schoolName && report.schoolName !== schoolNameGlobal) {
                        setSchoolNameGlobal(report.schoolName);
                        localStorage.setItem("moe_school_name", report.schoolName);
                      }
                    }}
                    className={`p-3 rounded-xl border text-right cursor-pointer transition-all group flex items-center justify-between ${
                      isActive 
                        ? "bg-navy border-slate-950 text-white shadow-md shadow-navy/10" 
                        : "bg-[#f8fafc] hover:bg-slate-100 border-slate-200/60 text-slate-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pl-2">
                      <p className={`font-bold text-xs truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                        {report.programName.trim() || "تقرير بدون عنوان"}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        <span className={`font-semibold shrink-0 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                          {report.programField.trim() || "غير محدد المجال"}
                        </span>
                        <span className={`shrink-0 flex items-center gap-1 ${isActive ? "text-gold-light" : "text-teal"}`}>
                          <Clock className="w-3 h-3" />
                          {report.progDate || "بلا تاريخ"}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(report.id, report.programName);
                      }}
                      className={`p-1.5 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                        isActive 
                          ? "hover:bg-rose-500/20 text-rose-300 hover:text-rose-200" 
                          : "hover:bg-slate-200 text-slate-400 hover:text-rose-600"
                      }`}
                      title="حذف المسودة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Backups Export/Import Actions */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-500">
              <button 
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-1 bg-[#f8fafc] hover:bg-slate-100 border border-slate-200/60 py-2 px-2.5 rounded-lg transition-all hover:text-slate-700"
              >
                <FileDown className="w-3.5 h-3.5 text-teal" />
                حفظ نسخة للاحتياط
              </button>
              
              <label className="flex items-center justify-center gap-1 bg-[#f8fafc] hover:bg-slate-100 border border-slate-200/60 py-2 px-2.5 rounded-lg transition-all hover:text-slate-700 cursor-pointer text-center">
                <FileUp className="w-3.5 h-3.5 text-gold" />
                استعادة نسخة سابقة
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Document Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col gap-3">
            <h3 className="font-bold text-xs text-navy flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-teal rounded-full" />
              حالة المستند الحالي
            </h3>
            <div className="flex flex-col gap-2">
              <div className="text-[11px] flex justify-between font-bold text-slate-700">
                <span>نسبة الاكتمال والجاهزية</span>
                <span className="text-teal font-extrabold">{completionPercentage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-teal to-teal-light h-full rounded-full" 
                />
              </div>
              <p className="text-[10.5px] text-[#64748b] leading-normal">
                {completionPercentage === 100 
                  ? "✓ التقرير مكتمل وجاهز للطباعة والاعتماد بنسبة 100%!" 
                  : "يرجى ملء الحقول ورفع الشواهد لزيادة جاهزية تقريرك."}
              </p>
            </div>
          </div>

          {/* Form Action Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5 grid grid-cols-4 gap-2 text-center">
            
            <button 
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all ${
                isGenerating 
                  ? "bg-indigo-50 text-indigo-400 opacity-80" 
                  : "hover:bg-indigo-50/70 text-indigo-600 active:scale-95"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                isGenerating 
                  ? "bg-indigo-400 animate-pulse" 
                  : "bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-100"
              }`}>
                <Sparkles className={`w-5 h-5 ${isGenerating ? "animate-spin" : ""}`} />
              </div>
              <span className="text-[11px] font-bold">توليد ذكي</span>
            </button>

            <button 
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-50 text-navy active:scale-95 transition-all ${
                isExportingPdf ? "opacity-70 pointer-events-none" : ""
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-navy to-deep shadow-md shadow-slate-200 rounded-xl flex items-center justify-center text-white">
                {isExportingPdf ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 text-gold-light" />
                )}
              </div>
              <span className="text-[11px] font-bold">حفظ PDF</span>
            </button>

            <button 
              onClick={() => setShowPdfInstructions(true)}
              className="p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer hover:bg-cyan-50/70 text-teal active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-teal to-teal-light shadow-md shadow-cyan-100 rounded-xl flex items-center justify-center text-white">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">طباعة ورقية</span>
            </button>

            <button 
              onClick={handleClearCurrentForm}
              className="p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-100 text-slate-600 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-slate-600 to-slate-500 shadow-md shadow-slate-100 rounded-xl flex items-center justify-center text-white">
                <RotateCcw className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">مسح الحقول</span>
            </button>

          </div>

          {/* MAIN FORM PANEL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col min-h-[420px]">
            
            {/* Tabs Selector */}
            <div className="bg-[#f1f5f9] border-b border-slate-200/80 flex p-1.5 gap-1 font-bold text-xs text-slate-500">
              <button 
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "info" 
                    ? "bg-white text-navy border-b-2 border-teal shadow-sm" 
                    : "text-[#64748b] hover:text-navy hover:bg-white/40"
                }`}
              >
                <School className="w-4 h-4 text-teal" />
                بطاقة البرنامج
              </button>

              <button 
                onClick={() => setActiveTab("goals")}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "goals" 
                    ? "bg-white text-navy border-b-2 border-teal shadow-sm" 
                    : "text-[#64748b] hover:text-navy hover:bg-white/40"
                }`}
              >
                <FileText className="w-4 h-4 text-gold" />
                الأهداف والخطوات
              </button>

              <button 
                onClick={() => setActiveTab("images")}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "images" 
                    ? "bg-white text-navy border-b-2 border-teal shadow-sm" 
                    : "text-[#64748b] hover:text-navy hover:bg-white/40"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                الشواهد والوثائق
              </button>
            </div>

            {/* Tab content screens */}
            <div className="p-5 flex-1 flex flex-col relative overflow-hidden">
              
              {/* Spinner loader for AI Generation */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-[#c9a84c]/20 border-t-[#0e7490] rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <motion.p 
                      key={loadingMessageIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="font-bold text-sm text-[#0a1628] max-w-sm leading-relaxed"
                    >
                      {LOADING_MESSAGES[loadingMessageIdx]}
                    </motion.p>
                    <span className="text-[10px] text-slate-400 mt-2 font-semibold">توليد مدعوم بـ نموذج Gemini 3.5 Flash</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab 1: Info Screen */}
              {activeTab === "info" && (
                <motion.div 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-teal" />
                        نوع التقرير
                      </label>
                      <select 
                        value={activeReport.reportType || "تقرير نشاط مدرسي عام"}
                        onChange={(e) => {
                          const newType = e.target.value;
                          updateActiveReport({ 
                            reportType: newType
                          });
                        }}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
                      >
                        <option value="تقرير نشاط مدرسي عام">تقرير نشاط مدرسي عام</option>
                        <option value="تقرير برنامج ثقافي">تقرير برنامج ثقافي</option>
                        <option value="تقرير برنامج اجتماعي">تقرير برنامج اجتماعي</option>
                        <option value="تقرير برنامج علمي">تقرير برنامج علمي</option>
                        <option value="تقرير برنامج رياضي">تقرير برنامج رياضي</option>
                        <option value="تقرير برنامج توعوي وإرشاد طلابي">تقرير برنامج توعوي وإرشاد طلابي</option>
                        <option value="تقرير ورشة عمل / تدريب">تقرير ورشة عمل / تدريب</option>
                        <option value="تقرير فعاليات ومناسبات وطنية">تقرير فعاليات ومناسبات وطنية</option>
                        <option value="تقرير إداري">تقرير إداري</option>
                        <option value="تقرير مبادرة تطوعية">تقرير مبادرة تطوعية</option>
                        <option value="تقرير اجتماع مجلس المدرسة">تقرير اجتماع مجلس المدرسة</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-teal" />
                        اسم البرنامج / الفعالية
                      </label>
                      <input 
                        type="text"
                        value={activeReport.programName}
                        onChange={(e) => updateActiveReport({ programName: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                        placeholder="أدخل مسمى الفعالية أو البرنامج يدويّاً..."
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal" />
                        تاريخ التنفيذ (هجري)
                      </label>
                      <input 
                        type="text"
                        value={activeReport.progDate}
                        onChange={(e) => updateActiveReport({ progDate: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all text-right"
                        placeholder="مثال: ١٨ / ٠٦ / ١٤٤٨ هـ"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-teal" />
                        عدد المستفيدين
                      </label>
                      <input 
                        type="text"
                        value={activeReport.progCount}
                        onChange={(e) => updateActiveReport({ progCount: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                        placeholder="مثال: أكثر من 150 طالب"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <School className="w-3.5 h-3.5 text-teal" />
                        المنفذ / المنفذون
                      </label>
                      <input 
                        type="text"
                        value={activeReport.progExec}
                        onChange={(e) => updateActiveReport({ progExec: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                        placeholder="المعلمون أو رائد النشاط"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal" />
                        الفئة المستهدفة
                      </label>
                      <input 
                        type="text"
                        value={activeReport.progBene}
                        onChange={(e) => updateActiveReport({ progBene: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                        placeholder="مثال: جميع طلاب المرحلة الابتدائية"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-teal" />
                        معد التقرير (الصفة)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateActiveReport({ preparerTitle: "معدة التقرير" })}
                          className={`flex-1 p-2 text-xs font-bold rounded-xl border transition-all ${
                            (activeReport.preparerTitle || "معدة التقرير") === "معدة التقرير"
                              ? "bg-teal/10 border-teal text-teal"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          معدة التقرير (أنثى)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateActiveReport({ preparerTitle: "معد التقرير" })}
                          className={`flex-1 p-2 text-xs font-bold rounded-xl border transition-all ${
                            (activeReport.preparerTitle || "معدة التقرير") === "معد التقرير"
                              ? "bg-teal/10 border-teal text-teal"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          معد التقرير (ذكر)
                        </button>
                      </div>
                      <input 
                        type="text"
                        value={activeReport.preparerTitle || "معدة التقرير"}
                        onChange={(e) => updateActiveReport({ preparerTitle: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 mt-1 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-right"
                        placeholder="أو اكتب صفة مخصصة (مثال: رائدة النشاط)"
                      />
                    </div>

                    <div className="flex flex-col gap-1 justify-end">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal" />
                        اسم معد التقرير (اختياري)
                      </label>
                      <input 
                        type="text"
                        value={activeReport.preparerName || ""}
                        onChange={(e) => updateActiveReport({ preparerName: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                        placeholder="مثال: أ. منيرة الغامدي"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-teal" />
                        مدير / مديرة المدرسة (الصفة)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateActiveReport({ managerTitle: "مديرة المدرسة" })}
                          className={`flex-1 p-2 text-xs font-bold rounded-xl border transition-all ${
                            (activeReport.managerTitle || "مديرة المدرسة") === "مديرة المدرسة"
                              ? "bg-teal/10 border-teal text-teal"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          مديرة المدرسة (أنثى)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateActiveReport({ managerTitle: "مدير المدرسة" })}
                          className={`flex-1 p-2 text-xs font-bold rounded-xl border transition-all ${
                            (activeReport.managerTitle || "مديرة المدرسة") === "مدير المدرسة"
                              ? "bg-teal/10 border-teal text-teal"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          مدير المدرسة (ذكر)
                        </button>
                      </div>
                      <input 
                        type="text"
                        value={activeReport.managerTitle || "مديرة المدرسة"}
                        onChange={(e) => updateActiveReport({ managerTitle: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 mt-1 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-right"
                        placeholder="أو اكتب صفة مخصصة (مثال: قائدة المدرسة)"
                      />
                    </div>

                    <div className="flex flex-col gap-1 justify-end">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal" />
                        اسم مدير / مديرة المدرسة (اختياري)
                      </label>
                      <input 
                        type="text"
                        value={activeReport.managerName || ""}
                        onChange={(e) => updateActiveReport({ managerName: e.target.value })}
                        className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                        placeholder="مثال: أ. هند السديري"
                      />
                    </div>

                  </div>

                  {/* AI trigger recommendation box */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs leading-normal mt-4">
                    <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-bold text-indigo-900 mb-1">أداة الصياغة التلقائية الذكية جاهزة!</p>
                      <p className="text-indigo-700">أدخل اسم البرنامج أولاً في الحقل أعلاه، ثم اضغط على زر <span className="font-bold">"توليد ذكي"</span> في شريط الأدوات بالخارج ليصوغ لك نموذج الذكاء الاصطناعي الأهداف والخطوات التربوية بدقة مذهلة.</p>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* Tab 2: Goals & Steps Screen */}
              {activeTab === "goals" && (
                <motion.div 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 flex-1 flex flex-col"
                >
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1 justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gold" />
                        أهداف البرنامج التربوية (مرقمة)
                      </span>
                      <span className="text-[10px] text-slate-400">يفضل 4 أهداف</span>
                    </label>
                    <textarea 
                      value={activeReport.goals}
                      onChange={(e) => updateActiveReport({ goals: e.target.value })}
                      className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 flex-1 min-h-[120px] resize-none"
                      placeholder="أدخل الأهداف مسبوقة بأرقام، مثال:&#10;1. تعزيز القيم والتقاليد التربوية...&#10;2. تشجيع المشاركة الفعالة..."
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1 justify-between">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gold" />
                        خطوات وإجراءات التنفيذ (مرقمة)
                      </span>
                      <span className="text-[10px] text-slate-400">يفضل 5-6 خطوات</span>
                    </label>
                    <textarea 
                      value={activeReport.steps}
                      onChange={(e) => updateActiveReport({ steps: e.target.value })}
                      className="bg-slate-50 border border-slate-200 focus:border-teal focus:ring-2 focus:ring-teal/10 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 flex-1 min-h-[120px] resize-none"
                      placeholder="أدخل الخطوات مسبوقة بأرقام، مثال:&#10;1. تشكيل اللجان التحضيرية وتوزيع المهام...&#10;2. عقد الورش وحلقات النقاش للطلاب..."
                    />
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Images & Evidences Screen */}
              {activeTab === "images" && (
                <motion.div 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 flex-1 flex flex-col"
                >
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      isDragOver 
                        ? "border-teal bg-teal/5" 
                        : "border-slate-300 hover:border-teal bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-navy">اسحب صور الشواهد والوثائق هنا أو اضغط للرفع</h4>
                      <p className="text-[10px] text-slate-400 mt-1">يُفضَّل رفع حتى 4 صور لتوثيق الفعالية وتضمينها بالتقرير</p>
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Uploaded images overview list */}
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-bold text-slate-500">
                      الصور المرفوعة حالياً ({activeReport.images.length} / 4)
                    </p>
                    {activeReport.images.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <p className="text-[11px] text-slate-400">لا توجد صور مرفوعة حالياً. سيتم عرض الصور الافتراضية للشواهد.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {activeReport.images.map((base64, index) => (
                          <div key={index} className="relative aspect-[4/3] rounded-xl border border-slate-200 overflow-hidden group">
                            <img src={base64} alt={`شاهد ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <button 
                                onClick={() => handleRemoveImage(index)}
                                className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition-all cursor-pointer"
                                title="إزالة الصورة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 right-1 bg-slate-900/75 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                              شاهد {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Footer Brand Banner */}
            <div className="bg-slate-900 p-4 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs mt-auto">
              <div className="flex items-center gap-1.5 font-serif text-slate-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                متجر سمسم ©
              </div>
              <a 
                href="https://t.me/+LmR3sqPOwghhMTY0" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 bg-teal/20 hover:bg-teal/40 text-cyan-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-cyan-500/20 transition-all font-semibold"
              >
                قناة التيليجرام
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

        {/* LEFT COLUMN: Real-time Live A4 Document Preview */}
        <div className="xl:col-span-7 flex flex-col">
          
          {/* Preview top title header with help */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 mb-4 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-sm text-navy">معاينة الطباعة المباشرة (A4)</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              التغييرات تُحدث فورياً. الورقة مطابقة لمواصفات الطباعة الحكومية.
            </span>
          </div>

          {/* Scroll container on screen to prevent overflowing on small devices, but full sheet on prints */}
          <div className="flex-1 overflow-x-auto p-1 bg-slate-200/40 rounded-3xl border border-slate-300/40 flex justify-center shadow-inner no-scrollbar xl:max-h-[850px] xl:overflow-y-auto">
            
            {/* The absolute A4 Sheet container */}
            <div id="report-print-area" className="print-page-container bg-white w-full max-w-[800px] min-h-[1130px] p-8 md:p-12 shadow-xl border border-slate-300/60 relative flex flex-col justify-between font-sans print-show-all">
              
              {/* Golden Outer Decorative Border */}
              <div className="absolute inset-4 border border-slate-200 pointer-events-none rounded" />
              <div className="absolute inset-4.5 border-2 border-gold/40 pointer-events-none rounded" />

              <div className="relative z-10 flex flex-col h-full flex-1 justify-between">
                
                {/* 1. Official Header Row */}
                <div>
                  <div className="grid grid-cols-3 items-center text-right pb-3 border-b-2 border-[#007A78]">
                    
                    {/* Right Block */}
                    <div className="flex items-center gap-3">
                      {schoolLogo && (
                        <img 
                          src={schoolLogo} 
                          alt="شعار المدرسة" 
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="w-12 h-12 object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="text-[11px] font-bold text-[#007A78] space-y-1">
                        <p className="text-[#007A78]">المملكة العربية السعودية</p>
                        <p className="text-[#007A78] font-extrabold text-[10px]">وزارة التعليم</p>
                        <p className="text-[#007A78]">إدارة التعليم بمحافظة / منطقة...</p>
                        <p className="text-[#007A78] font-black">{schoolNameGlobal || "اسم المدرسة غير محدد"}</p>
                      </div>
                    </div>

                    {/* Center Block */}
                    <div className="text-center flex flex-col items-center justify-center">
                      <img 
                        src="/logo.png" 
                        alt="شعار وزارة التعليم" 
                        className="h-14 md:h-16 w-auto object-contain shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Left Block */}
                    <div className="text-left text-[11px] font-bold text-slate-800 space-y-1">
                      <p className="text-slate-700">نوع التقرير: <span className="font-extrabold text-[#007A78]">{activeReport.reportType || "تقرير نشاط مدرسي عام"}</span></p>
                      <p className="text-slate-500">تاريخ الطباعة: {getTodayHijri()}</p>
                    </div>

                  </div>

                  {/* Report Title Banner */}
                  <div className="text-center my-6">
                    <span className="text-lg uppercase font-black text-gold tracking-widest block mb-1 font-sans">
                      تقرير
                    </span>
                    <h2 className="font-sans text-2xl font-black text-navy tracking-tight border-b-4 border-double border-gold inline-block px-8 pb-1.5">
                      {activeReport.programName.trim() || "تقرير برنامج مدرسي عام"}
                    </h2>
                  </div>

                  {/* 2. Program Details Grid Block */}
                  <div className="border border-slate-900 rounded-lg overflow-hidden mb-5 text-xs bg-slate-50/50 print-card">
                    <div className="border-b border-slate-900 p-3 flex gap-2">
                      <span className="font-bold text-slate-500 shrink-0">اسم البرنامج:</span>
                      <span className="font-extrabold text-slate-800">{activeReport.programName || "........................................................"}</span>
                    </div>

                    <div className="grid grid-cols-2 border-b border-slate-900">
                      <div className="p-3 border-l border-slate-900 flex gap-2">
                        <span className="font-bold text-slate-500 shrink-0">تاريخ التنفيذ:</span>
                        <span className="font-bold text-slate-800">{cleanHijriDate(activeReport.progDate) || "........................................................"}</span>
                      </div>
                      <div className="p-3 flex gap-2">
                        <span className="font-bold text-slate-500 shrink-0">المنفذ / المنفذون:</span>
                        <span className="font-bold text-slate-800">{activeReport.progExec || "........................................................"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-3 border-l border-slate-900 flex gap-2">
                        <span className="font-bold text-slate-500 shrink-0">المستفيدون:</span>
                        <span className="font-bold text-slate-800">{activeReport.progBene || "........................................................"}</span>
                      </div>
                      <div className="p-3 flex gap-2">
                        <span className="font-bold text-slate-500 shrink-0">عدد المستفيدين:</span>
                        <span className="font-bold text-slate-800">{activeReport.progCount || "........................................................"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Goals and Steps Double Box Column */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 print-half-grid">
                    
                    {/* Goals Block */}
                    <div className="border border-slate-900 rounded-lg p-4 flex flex-col bg-white print-card">
                      <h4 className="font-bold text-xs text-navy border-b border-slate-300 pb-1.5 mb-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-gold rounded-full" />
                        أهداف البرنامج التربوية:
                      </h4>
                      {activeReport.goals ? (
                        <div className="text-[11px] text-slate-800 font-medium leading-relaxed whitespace-pre-line space-y-1">
                          {activeReport.goals}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic space-y-2 mt-2">
                          <p>1. ........................................................................................</p>
                          <p>2. ........................................................................................</p>
                          <p>3. ........................................................................................</p>
                          <p>4. ........................................................................................</p>
                        </div>
                      )}
                    </div>

                    {/* Steps Block */}
                    <div className="border border-slate-900 rounded-lg p-4 flex flex-col bg-white print-card">
                      <h4 className="font-bold text-xs text-navy border-b border-slate-300 pb-1.5 mb-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-teal rounded-full" />
                        خطوات وإجراءات التنفيذ:
                      </h4>
                      {activeReport.steps ? (
                        <div className="text-[11px] text-slate-800 font-medium leading-relaxed whitespace-pre-line space-y-1">
                          {activeReport.steps}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic space-y-2 mt-2">
                          <p>1. ........................................................................................</p>
                          <p>2. ........................................................................................</p>
                          <p>3. ........................................................................................</p>
                          <p>4. ........................................................................................</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* 4. Evidences & Photos Grid */}
                  <div className="border border-slate-900 rounded-lg p-4 bg-white print-card">
                    <h4 className="font-bold text-xs text-navy border-b border-slate-300 pb-1.5 mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-indigo-600 rounded-full" />
                      شواهد ووثائق تنفيذ البرنامج (توثيق مرئي):
                    </h4>

                    <div className="grid grid-cols-4 gap-3 print-grid">
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const img = activeReport.images[idx];
                        return (
                          <div 
                            key={idx} 
                            className="aspect-[4/3] border border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center relative shadow-sm"
                          >
                            {img ? (
                              <img src={img} alt={`شاهد ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-2 text-slate-300 flex flex-col items-center justify-center">
                                <ImageIcon className="w-5 h-5 mb-1 text-slate-300" />
                                <span className="text-[8px] font-bold block text-slate-400">شاهد {idx + 1}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* 5. Official Ministry Signatures row at very bottom */}
                <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-center text-xs font-bold text-slate-800">
                  <div className="space-y-2">
                    <p className="font-extrabold text-teal-900 text-[13px]">{activeReport.preparerTitle || "معدة التقرير"}</p>
                    <p className="text-slate-700">
                      الاسم: <span className="font-extrabold text-slate-950 underline decoration-dotted underline-offset-4">{activeReport.preparerName || "...................................."}</span>
                    </p>
                    <p className="text-slate-700">
                      التوقيع: <span className="text-slate-400">....................................</span>
                    </p>
                  </div>
                  <div className="space-y-2 border-r border-slate-200">
                    <p className="font-extrabold text-teal-900 text-[13px]">{activeReport.managerTitle || "مديرة المدرسة"}</p>
                    <p className="text-slate-700">
                      الاسم: <span className="font-extrabold text-slate-950 underline decoration-dotted underline-offset-4">{activeReport.managerName || "...................................."}</span>
                    </p>
                    <p className="text-slate-700">
                      التوقيع: <span className="text-slate-400">....................................</span>
                    </p>
                  </div>
                </div>

              </div>
              
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
