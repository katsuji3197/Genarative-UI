// UI スタイル関連の型定義
export type StyleVariant = "standard" | "novice" | "expert";

export interface UIConfig {
  layout: StyleVariant;
  text: StyleVariant;
  button: StyleVariant;
  input: StyleVariant;
  description: StyleVariant;
}

// UIConfig にオプショナルで Presentation を含められるようにする
export interface UIConfigWithPresentation extends UIConfig {
  presentation?: PresentationConfig;
}

// 実験モード
export type ExperimentMode = "experimental" | "control";

// 事前アンケート回答（UI比較テスト + アイコンテスト）
export interface PreSurveyAnswers {
  // UI比較テストの回答（A or B）
  ui_comparisons: Record<string, "A" | "B">; // questionId => 選択した回答
  // アイコンテストのスコア
  icon_score: string; // 例: "3/5"
  // アイコンテストのユーザー回答
  icon_answers: string[]; // 各アイコンのユーザー入力
}

// 事後アンケート回答
export interface PostSurveyAnswers {
  q1_seq: number; // 1-7 (容易性)
  q2_satisfaction: number; // 1-5 or 1-7 (満足度)
  q3_preference: number; // 1-5 or 1-7 (UIの好み)
  q4_comment: string; // 自由記述
}

// 実験データ
export interface ExperimentData {
  participant_id: string;
  timestamp: string;
  group: ExperimentMode;
  ui_layout: StyleVariant;
  ui_text: StyleVariant;
  ui_button: StyleVariant;
  ui_input: StyleVariant;
  ui_description: StyleVariant;
  presentation?: PresentationConfig; // UI表示方法の設定
  reasons?: Record<string, string>; // AI判断理由
  // UI比較テストの回答（各questionIdの選択結果）
  pre_ui_comparisons: Record<string, "A" | "B">;
  // アイコンテストのスコア
  pre_icon_score: string;
  // アイコンテストのユーザー回答（各アイコンへの入力）
  pre_icon_answers: string[];
  time_dashboard: number;
  time_profile: number;
  time_task_total: number;
  total_clicks: number;
  task_success: number;
  post_q1_seq: number;
  post_q2_satisfaction: number;
  post_q3_preference: number;
  post_q4_comment: string;
  // タスクごとの時間計測など、動的なフィールドをサポート
  [key: string]: string | number | string[] | Record<string, "A" | "B"> | PresentationConfig | Record<string, string> | ExperimentMode | StyleVariant | undefined;
}

// 時間計測関連
export interface TimeMetrics {
  dashboard_start: number;
  dashboard_end: number;
  profile_start: number;
  profile_end: number;
  task_start: number;
  task_end: number;
}

// アンケート質問の型定義
export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  question: string;
  type: "radio" | "text" | "scale" | "icontest";
  options?: QuestionOption[];
  min?: number;
  max?: number;
  placeholder?: string;
}

// カンバンボード関連
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
}

export interface Project {
  id: string;
  title: string;
  tasks: Task[];
}

// ユーザー関連
export interface User {
  id: string;
  name: string;
  email: string;
}

// パーソナライゼーション設定
export interface PersonalizationSettings {
  layout: Record<StyleVariant, string>;
  text: Record<StyleVariant, string>;
  button: Record<StyleVariant, string>;
  input: Record<StyleVariant, string>;
  description: Record<StyleVariant, string>;
}

// Presentation related types for button personalization
export type PresentationMode = "icon" | "text" | "icon_text";
export type TaskActionMode = "inline" | "menu" | "icon-only";

export interface PresentationConfig {
  buttons: Record<string, PresentationMode>;
  global?: PresentationMode;
  taskAction?: {
    default: TaskActionMode;
    modes: TaskActionMode[];
  };
}

// Gemini API レスポンス
export interface GeminiResponse {
  layout: StyleVariant;
  text: StyleVariant;
  button: StyleVariant;
  input: StyleVariant;
  description: StyleVariant;
}

// Gemini の返す拡張レスポンス（presentation と reasons を含む可能性）
export interface GeminiResponseExtended extends GeminiResponse {
  presentation?: PresentationConfig;
  reasons?: Record<string, string>;
}
