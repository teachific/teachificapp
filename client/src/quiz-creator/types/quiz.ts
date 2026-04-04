// ─── .quiz File Format Types ──────────────────────────────────────────────────

export type QuestionType =
  | "mcq"
  | "tf"
  | "matching"
  | "hotspot"
  | "fill_blank"
  | "short_answer"
  | "image_choice";

export interface McqData {
  choices: { id: string; text: string; correct: boolean }[];
  multiSelect: boolean;
}

export interface TfData {
  correct: boolean;
}

export interface MatchingPair {
  id: string;
  premise: string;
  response: string;
}
export interface MatchingData {
  pairs: MatchingPair[];
}

export type HotspotShape = "circle" | "rect";
export interface HotspotRegion {
  id: string;
  label: string;
  correct: boolean;
  shape: HotspotShape;
  // All values as % of image dimensions (0-100)
  x: number;
  y: number;
  radius?: number; // circle only
  width?: number;  // rect only
  height?: number; // rect only
}
export interface HotspotData {
  imageUrl: string; // data: URI
  imageAlt: string;
  regions: HotspotRegion[];
  multiSelect: boolean;
}

export interface FillBlankBlank {
  id: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
}
export interface FillBlankData {
  template: string; // use {{blankId}} placeholders
  blanks: FillBlankBlank[];
}

export interface ShortAnswerData {
  sampleAnswer: string;
  keywords: string[];
  autoGrade: boolean;
}

export interface ImageChoiceOption {
  id: string;
  imageUrl: string; // data: URI
  label: string;
  correct: boolean;
}
export interface ImageChoiceData {
  choices: ImageChoiceOption[];
  multiSelect: boolean;
}

export type QuestionData =
  | McqData
  | TfData
  | MatchingData
  | HotspotData
  | FillBlankData
  | ShortAnswerData
  | ImageChoiceData;

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  order: number;
  points: number;
  required: boolean;
  stem: string;
  image?: { url: string; alt: string } | null;
  explanation: string;
  data: QuestionData;
}

export interface QuizMeta {
  id: string;
  title: string;
  description: string;
  author: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  licenseKey: string | null;
  teachificOrgId: number | null;
  tags: string[];
  passingScore: number;
  timeLimit: number | null; // minutes
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showFeedback: "immediate" | "deferred" | "never";
  allowRetry: boolean;
  maxAttempts: number;
}

export interface QuizFile {
  meta: QuizMeta;
  questions: QuizQuestion[];
}

// ─── License ──────────────────────────────────────────────────────────────────
export type LicenseTier = "free" | "pro" | "enterprise";

export interface LicenseState {
  tier: LicenseTier;
  licenseKey: string | null;
  teachificEmail: string | null;
  teachificOrgId: number | null;
  validatedAt: string | null;
}
