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
    questionId: "q1_message_size",
    description: "どちらのメッセージアプリのUIが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/1-a.png",
      description: "ユーザ名が20px、本文が16px、メッセージ間の余白が16pxのコンパクトな見た目のメッセージアプリのUI。",
    },
    optionB: {
      imagePath: "/survey-images/1-b.png",
      description: "ユーザ名が24px、本文が20px、メッセージ間の余白が24pxの比較的ゆったりとした見た目のメッセージアプリのUI。",
    },
    category: "message_size",
  },
  {
    questionId: "q2_button_style",
    description: "どちらのショッピングアプリのUIが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/2-a.png",
      description: "メニューボタンはハンバーガーアイコンのみ、カテゴリの詳細へ遷移するボタンも矢印のみとシンプルなUI。",
    },
    optionB: {
      imagePath: "/survey-images/2-b.png",
      description: "メニューボタンは「メニュー」と書かれたボタン、カテゴリの詳細へ遷移するボタンも「もっと見る」と書かれたUI。",
    },
    category: "button_style",
  },

  // テキストサイズに関する質問（2問）
  {
    questionId: "q3_navigation_style",
    description: "どちらのカレンダーアプリのUIが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/3-a.png",
      description: "アイコンのみのボトムナビゲーション。",
    },
    optionB: {
      imagePath: "/survey-images/3-b.png",
      description: "アイコンとテキストの両方を表示したボトムナビゲーション。",
    },
    category: "navigation_style",
  },
  {
    questionId: "q4_todo_list_style",
    description: "どちらのTo Doリストアプリが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/4-a.png",
      description: "To Doを追加するボタンはプラスマークのみが描かれている。タスクの編集ボタンもペンマークのみ。",
    },
    optionB: {
      imagePath: "/survey-images/4-b.png",
      description: "To Doを追加するボタンはプラスマークの右に追加と書かれたボタン、タスクの編集ボタンもペンマークの右に編集と書かれている。",
    },
    category: "todo_list_style",
  },

  // レイアウトの密度に関する質問（2問）
  {
    questionId: "q5_input_style",
    description: "どちらの経路案内が使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/5-a.png",
      description: "インプット、検索ボタンの高さが64pxの経路案内のUI。文字サイズは32px。",
    },
    optionB: {
      imagePath: "/survey-images/5-b.png",
      description: "インプット、検索ボタンの高さが90pxの経路案内のUI。文字サイズは32px。",
    },
    category: "input_style",
  },
  {
    questionId: "q6_button_gap",
    description: "どちらのボタン一覧が使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/6-a.png",
      description: "ボタン同士の横のgapは12px、縦のgapは16pxのボタン一覧のUI。",
    },
    optionB: {
      imagePath: "/survey-images/6-b.png",
      description: "ボタン同士の横のgapは38px、縦のgapは48pxのボタン一覧のUI。",
    },
    category: "button_gap",
  },

  // アイコンとテキストの表示に関する質問（2問）
  {
    questionId: "q7_download_icon",
    description: "どちらの公式サイトが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/7-a.png",
      description: "「ログイン」「ダウンロード」ボタンがあり、どちらもテキストのみで表示されている。",
    },
    optionB: {
      imagePath: "/survey-images/7-b.png",
      description: "「ログイン」「ダウンロード」ボタンがあり、どちらもアイコンとテキストの両方を表示されている。",
    },
    category: "download_icon",
  },
  {
    questionId: "q8_text_style",
    description: "どちらのWebサイトが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/8-a.png",
      description: "タイトルがstone-400・20px・Regularで表示、製品名がstone-800・24px・Boldで表示されている。タイトルと製品のgapが24px、製品どうしのgapが16px。",
    },
    optionB: {
      imagePath: "/survey-images/8-b.png",
      description: "タイトルがstone-400・20px・Regularで表示、製品名がstone-800・20px・Boldで表示されている。タイトルと製品のgapが16px、製品どうしのgapが8px。",
    },
    category: "text_style",
  },

  // 説明文の詳細度に関する質問（2問）
  {
    questionId: "q9_control_button_style",
    description: "どちらのコントロールセンターのボタンが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/9-a.png",
      description: "Wi-Fiボタン、Bluetoothボタン、機内モードボタン、懐中電灯ボタンがあり、いずれもアイコンのみで表示されていて、状態はアイコンの見た目で判断できるようになっている。",
    },
    optionB: {
      imagePath: "/survey-images/9-b.png",
      description: "Wi-Fiボタン、Bluetoothボタン、機内モードボタン、懐中電灯ボタンがあり、いずれもアイコンとテキストの両方が表示されていて、状態はテキストとアイコンの見た目で判別できるようになっている。",
    },
    category: "control_button_style",
  },
  {
    questionId: "q10_message_input",
    description: "どちらのメッセージアプリの入力フィールドが使いやすいと感じますか？",
    optionA: {
      imagePath: "/survey-images/10-a.png",
      description: "入力フィールドに「メッセージを入力」というラベルとヒントテキストが表示されている。送信ボタンはアイコンのみ。",
    },
    optionB: {
      imagePath: "/survey-images/10-b.png",
      description: "入力フィールドに「メッセージを入力」というラベルのみ表示。送信ボタンはアイコンとテキストの両方が表示されている。",
    },
    category: "message_input",
  },
];

/**
 * カテゴリーとUI設定の対応マップ
 * Geminiがユーザーの選択を分析する際の参考情報
 */
export const CATEGORY_TO_UI_MAPPING = {
  message_size: {
    optionA: "expert", // コンパクトな見た目（20px, 16px, gap 16px）→ 上級者向け
    optionB: "normal", // ゆったりした見た目（24px, 20px, gap 24px）→ 初心者向け
  },
  button_style: {
    optionA: "expert", // アイコンのみ → 上級者向け
    optionB: "novice", // テキスト付き → 初心者向け
  },
  navigation_style: {
    optionA: "expert", // アイコンのみ → 上級者向け
    optionB: "normal", // アイコン+テキスト → 初心者向け
  },
  todo_list_style: {
    optionA: "expert", // アイコンのみ → 上級者向け
    optionB: "novice", // アイコン+テキスト → 初心者向け
  },
  input_style: {
    optionA: "normal", // コンパクト（高さ64px）→ 上級者向け
    optionB: "novice", // 大きい（高さ90px）→ 初心者向け
  },
  button_gap: {
    optionA: "expert", // 狭い間隔（12px/16px）→ 上級者向け
    optionB: "novice", // 広い間隔（38px/48px）→ 初心者向け
  },
  download_icon: {
    optionA: "expert", // テキストのみ → 初心者向け
    optionB: "normal", // アイコン+テキスト → 初心者向け（わかりやすい）
  },
  text_style: {
    optionA: "normalt", // 大きい文字・ゆったり（24px, gap 24px/16px）→ 初心者向け
    optionB: "expert", // 小さい文字・コンパクト（20px, gap 16px/8px）→ 上級者向け
  },
  control_button_style: {
    optionA: "expert", // アイコンのみ → 上級者向け
    optionB: "normal", // アイコン+テキスト → 初心者向け
  },
  message_input: {
    optionA: "expert", // ラベル+ヒント、送信ボタンはアイコンのみ → 初心者向け
    optionB: "normal", // ラベルのみ、送信ボタンはアイコン+テキスト → 上級者向け
  },
};

