export interface EvidenceImage {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface ProgramReport {
  id: string;
  schoolName: string;
  educationOffice: string;
  reportType: string;
  programName: string;
  programField: string;
  programDate: string;
  programTime: string;
  duration: string;
  location: string;
  executor: string;
  beneficiaries: string;
  beneficiaryCount: string;
  goals: string;
  steps: string;
  outcomes: string;
  recommendations: string;
  notes: string;
  images: EvidenceImage[];
  preparerTitle: string;
  preparerName: string;
  managerTitle: string;
  managerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartDraft {
  field: string;
  beneficiaries: string;
  beneficiaryCount: string;
  goals: string;
  steps: string;
  outcomes: string;
  recommendations: string;
}

export type EditorTab = 'details' | 'content' | 'evidence';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
