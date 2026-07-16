export interface ProgramReport {
  id: string;
  schoolName: string;
  programName: string;
  programField: string;
  reportType?: string; // نوع التقرير
  progDate: string;
  progExec: string;
  progBene: string;
  progCount: string;
  goals: string;
  steps: string;
  images: string[]; // base64 encoded images, up to 4
  createdAt: string;
  preparerTitle?: string; // صفة معد التقرير (مثال: معدة التقرير، معد التقرير)
  preparerName?: string; // اسم معد التقرير
  managerTitle?: string; // صفة مدير المدرسة (مثال: مدير المدرسة، مديرة المدرسة)
  managerName?: string; // اسم مدير المدرسة
}

export interface GenerationResponse {
  goals: string;
  steps: string;
  field?: string;
  beneficiaries?: string;
  count?: string;
  isFallback?: boolean;
}
