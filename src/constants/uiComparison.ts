/**
 * UI比較アンケート用の定数
 * ユーザーに2つのUIを比較してもらい、どちらが操作しやすいかを判断してもらう
 */

export interface UIComparisonQuestion {
  questionId: string;
  description: string; // ユーザー向けの判断ポイントの説明
  optionA: {
    imagePath: string;
    description: string; // Geminiに渡すための説明
  };
  optionB: {
    imagePath: string;
    description: string; // Geminiに渡すための説明
  };
  category: string; // 判断カテゴリ（button_size, text_size, layout_density など）
}

/**
 * UI比較アンケートの質問リスト
 * 10問程度の質問を用意
 */
export const UI_COMPARISON_QUESTIONS: UIComparisonQuestion[] = [
  // ボタンサイズに関する質問（2問）
  {
    questionId: "q1_button_size",
    description: "ボタンのサイズについて、どちらが押しやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/button_large.png",
      description: "大きなボタン（48px×48px）を持つUI。ボタン同士の間隔も広く、誤タップしにくい設計。",
    },
    optionB: {
      imagePath: "/images/comparison/button_small.png",
      description: "コンパクトなボタン（32px×32px）を持つUI。画面スペースを効率的に使用し、多くの情報を表示できる。",
    },
    category: "button_size",
  },
  {
    questionId: "q2_button_spacing",
    description: "ボタンの配置について、どちらが操作しやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/button_wide_spacing.png",
      description: "ボタン間の余白が広い（16px）UI。各ボタンが独立して見え、押し間違えにくい。",
    },
    optionB: {
      imagePath: "/images/comparison/button_tight_spacing.png",
      description: "ボタン間の余白が狭い（8px）UI。コンパクトにまとまり、一覧性が高い。",
    },
    category: "button_spacing",
  },

  // テキストサイズに関する質問（2問）
  {
    questionId: "q3_text_size",
    description: "文字の大きさについて、どちらが読みやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/text_large.png",
      description: "大きな文字サイズ（18px）のUI。テキストが読みやすく、視認性が高い。",
    },
    optionB: {
      imagePath: "/images/comparison/text_small.png",
      description: "標準的な文字サイズ（14px）のUI。一画面により多くの情報を表示できる。",
    },
    category: "text_size",
  },
  {
    questionId: "q4_text_hierarchy",
    description: "文字の強弱について、どちらが見やすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/text_high_contrast.png",
      description: "見出しと本文の差が大きい（見出し24px、本文14px）UI。情報の階層が明確。",
    },
    optionB: {
      imagePath: "/images/comparison/text_low_contrast.png",
      description: "見出しと本文の差が小さい（見出し16px、本文14px）UI。統一感があり落ち着いた印象。",
    },
    category: "text_hierarchy",
  },

  // レイアウトの密度に関する質問（2問）
  {
    questionId: "q5_layout_density",
    description: "情報の詰まり具合について、どちらが使いやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/layout_spacious.png",
      description: "余白が多い（padding 24px）ゆったりしたレイアウト。各要素が独立して見やすい。",
    },
    optionB: {
      imagePath: "/images/comparison/layout_compact.png",
      description: "余白が少ない（padding 12px）コンパクトなレイアウト。一覧性が高く、多くの情報を表示。",
    },
    category: "layout_density",
  },
  {
    questionId: "q6_card_design",
    description: "カードの表示について、どちらが見やすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/card_large.png",
      description: "大きなカード（最小高さ120px）で情報を表示。各項目がゆったりと配置されている。",
    },
    optionB: {
      imagePath: "/images/comparison/card_small.png",
      description: "コンパクトなカード（最小高さ80px）で情報を表示。一画面に多くの項目を表示できる。",
    },
    category: "card_size",
  },

  // アイコンとテキストの表示に関する質問（2問）
  {
    questionId: "q7_icon_presentation",
    description: "ボタンの表示方法について、どちらがわかりやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/icon_only.png",
      description: "アイコンのみを表示したボタン。シンプルでスッキリした見た目。",
    },
    optionB: {
      imagePath: "/images/comparison/icon_with_text.png",
      description: "アイコンとテキストの両方を表示したボタン。機能が明確でわかりやすい。",
    },
    category: "icon_presentation",
  },
  {
    questionId: "q8_menu_style",
    description: "メニューの表示について、どちらが使いやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/menu_icon.png",
      description: "アイコンのみのメニュー。画面を広く使え、見た目がモダン。",
    },
    optionB: {
      imagePath: "/images/comparison/menu_text.png",
      description: "テキストラベル付きのメニュー。各項目の意味が一目でわかる。",
    },
    category: "menu_style",
  },

  // 説明文の詳細度に関する質問（2問）
  {
    questionId: "q9_description_detail",
    description: "説明文の量について、どちらが好ましいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/description_detailed.png",
      description: "詳細な説明文（2-3行）を表示。操作方法や注意点が丁寧に記載されている。",
    },
    optionB: {
      imagePath: "/images/comparison/description_brief.png",
      description: "簡潔な説明文（1行）を表示。最小限の情報で画面がスッキリしている。",
    },
    category: "description_detail",
  },
  {
    questionId: "q10_input_label",
    description: "入力フィールドの説明について、どちらがわかりやすいと感じますか？",
    optionA: {
      imagePath: "/images/comparison/input_verbose.png",
      description: "入力フィールドに詳しいラベルとヒントテキストが表示されている。何を入力すべきか明確。",
    },
    optionB: {
      imagePath: "/images/comparison/input_minimal.png",
      description: "入力フィールドに簡潔なラベルのみ表示。シンプルで洗練された印象。",
    },
    category: "input_label",
  },
];

/**
 * カテゴリーとUI設定の対応マップ
 * Geminiがユーザーの選択を分析する際の参考情報
 */
export const CATEGORY_TO_UI_MAPPING = {
  button_size: {
    optionA: "novice", // 大きなボタン → 初心者向け
    optionB: "expert", // 小さなボタン → 上級者向け
  },
  button_spacing: {
    optionA: "novice", // 広い間隔 → 初心者向け
    optionB: "expert", // 狭い間隔 → 上級者向け
  },
  text_size: {
    optionA: "novice", // 大きな文字 → 初心者向け
    optionB: "expert", // 小さな文字 → 上級者向け
  },
  text_hierarchy: {
    optionA: "novice", // 強い階層 → 初心者向け
    optionB: "expert", // 弱い階層 → 上級者向け
  },
  layout_density: {
    optionA: "novice", // ゆったり → 初心者向け
    optionB: "expert", // コンパクト → 上級者向け
  },
  card_size: {
    optionA: "novice", // 大きなカード → 初心者向け
    optionB: "expert", // 小さなカード → 上級者向け
  },
  icon_presentation: {
    optionA: "expert", // アイコンのみ → 上級者向け
    optionB: "novice", // アイコン+テキスト → 初心者向け
  },
  menu_style: {
    optionA: "expert", // アイコンのみ → 上級者向け
    optionB: "novice", // テキスト付き → 初心者向け
  },
  description_detail: {
    optionA: "novice", // 詳細 → 初心者向け
    optionB: "expert", // 簡潔 → 上級者向け
  },
  input_label: {
    optionA: "novice", // 詳細 → 初心者向け
    optionB: "expert", // 簡潔 → 上級者向け
  },
};

