import { PreSurveyAnswers, GeminiResponse, PresentationConfig, PresentationMode, GeminiResponseExtended } from "@/types";
import personalizationConfig from "@/config/personalization.json";
import { UI_COMPARISON_QUESTIONS, CATEGORY_TO_UI_MAPPING } from "@/constants/uiComparison";

type UserAttributes = {
  confidence?: number;
  preference?: number;
  textIssue?: number;
  tapError?: number;
  priority?: number;
  iconScore?: string; // "X/5"
};

export class GeminiService {
  private apiKey: string;
  private apiUrl: string;
  private configCache: Map<string, GeminiResponseExtended>;
  private iconScoreCache: Map<string, string>;
  private cacheExpiry: number = 5 * 60 * 1000; // 5分でキャッシュ有効期限
  private maxRetries: number = 30; // 最大リトライ回数
  private retryDelayBase: number = 1000; // リトライ待機時間のベース（ミリ秒）

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
    this.configCache = new Map();
    this.iconScoreCache = new Map();
  }

  /**
   * 指数バックオフでリトライするfetchラッパー
   * 503エラーの場合のみリトライを実行
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount: number = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // 503エラーの場合のみリトライ
      if (response.status === 503 && retryCount < this.maxRetries) {
        const delay = this.retryDelayBase * Math.pow(2, retryCount); // 指数バックオフ
        console.log(`🔄 503エラーが発生しました。${delay}ms後にリトライします（${retryCount + 1}/${this.maxRetries}）`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      // ネットワークエラーの場合も503と同様にリトライ
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelayBase * Math.pow(2, retryCount);
        console.log(`🔄 ネットワークエラーが発生しました。${delay}ms後にリトライします（${retryCount + 1}/${this.maxRetries}）`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * アンケート回答からキャッシュキーを生成
   */
  private generateCacheKey(answers: PreSurveyAnswers): string {
    // UI比較の回答をソートしてキーに含める
    const comparisons = Object.entries(answers.ui_comparisons)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `${comparisons}-icon:${answers.icon_score}`;
  }

  /**
   * アイコン回答からキャッシュキーを生成
   */
  private generateIconCacheKey(iconAnswers: string[]): string {
    return iconAnswers.join('|');
  }

  /**
   * ユーザ属性とbaseの personalization.json を組み合わせて最終的な PresentationConfig を返す
   */
  getPresentationForUser(userAttributes: UserAttributes): PresentationConfig {
    // base config from JSON (may not have strict typing)
    const base = (personalizationConfig as Record<string, unknown>)["presentation"] || {};

    // start with defaults
    const result: PresentationConfig = {
      buttons: (base as Record<string, unknown>).buttons as Record<string, PresentationMode> || { default: ((base as Record<string, unknown>).default as PresentationMode) || "icon" },
      global: ((base as Record<string, unknown>).global as PresentationMode) || ((base as Record<string, unknown>).default as PresentationMode) || "icon",
    };

    // Simple override rules based on attributes (can be extended)
    // If user has low iconScore (e.g., "1/5" or "2/5"), prefer text for critical buttons
    const iconScore = userAttributes.iconScore;
    if (iconScore) {
      const match = iconScore.match(/(\d)\/5/);
      if (match) {
        const score = parseInt(match[1], 10);
        if (score <= 2) {
          // use text-heavy presentation
          result.global = "text";
        } else if (score === 3) {
          result.global = "icon_text";
        } else {
          result.global = result.global || "icon";
        }
      }
    }

    // If user has high tapError, use larger buttons (we don't change presentation mode here, but could)
    if (userAttributes.tapError && userAttributes.tapError >= 4) {
      // prefer icon_text for better discoverability
      result.global = "icon_text";
    }

    return result;
  }

  async evaluateIconAnswers(iconAnswers: string[]): Promise<string> {
    // キャッシュをチェック
    const cacheKey = this.generateIconCacheKey(iconAnswers);
    const cached = this.iconScoreCache.get(cacheKey);
    if (cached) {
      console.log("💾 キャッシュからアイコンスコアを取得:", cached);
      return cached;
    }

    // 空の回答をチェック
    const hasEmptyAnswers = iconAnswers.some(answer => !answer || answer.trim() === "");
    if (hasEmptyAnswers) {
      console.warn("⚠️ 空の回答が含まれています。ローカル採点を使用");
      const score = this.evaluateIconAnswersLocally(iconAnswers);
      this.iconScoreCache.set(cacheKey, score);
      return score;
    }

    if (!this.apiKey) {
      console.warn("Gemini API key not found, using local scoring");
      const score = this.evaluateIconAnswersLocally(iconAnswers);
      this.iconScoreCache.set(cacheKey, score);
      return score;
    }

    const prompt = `
以下のアイコンクイズの回答を評価してください。各アイコンについて、ユーザーの回答が意味的に正解かどうかを判定し、正解数を返してください。

アイコンと正解例：
1. ≡ (ハンバーガーメニューアイコン): メニュー、ハンバーガー、三本線、ナビゲーション、設定、リスト など
2. ↗ (共有アイコン): 共有、シェア、送信、エクスポート、転送、外部 など  
3. ⧉ (コピーアイコン): コピー、複製、複写、コピペ、クリップボード、貼り付け など
4. ↓ (ダウンロードアイコン): ダウンロード、保存、取得、落とす、DL、矢印 など
5. ♡ (ハートアイコン): ハート、いいね、お気に入り、好き、ライク、愛、ブックマーク など

ユーザーの回答：
1. ハンバーガーメニュー → "${iconAnswers[0]}"
2. 共有 → "${iconAnswers[1]}" 
3. コピー → "${iconAnswers[2]}"
4. ダウンロード → "${iconAnswers[3]}"
5. ハート → "${iconAnswers[4]}"

重要：意味的に合っていれば正解としてください（完全一致である必要はありません）。
正解数のみを「X/5」の形式で返してください（例：「3/5」）。`;

    try {
      const response = await this.fetchWithRetry(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        console.warn(`API error: ${response.status}, using local scoring`);
        return this.evaluateIconAnswersLocally(iconAnswers);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!result) {
        console.warn("Empty API response, using local scoring");
        return this.evaluateIconAnswersLocally(iconAnswers);
      }

      console.log("🎯 アイコンクイズ採点結果:", result);
      console.log("📝 ユーザー回答:", iconAnswers);

      // 正解数の形式をチェック（例：「3/5」）
      const scoreMatch = result.match(/(\d)\/5/);
      if (scoreMatch) {
        const score = scoreMatch[0];
        this.iconScoreCache.set(cacheKey, score);
        return score;
      } else {
        console.warn("Unexpected scoring format, using local scoring");
        const score = this.evaluateIconAnswersLocally(iconAnswers);
        this.iconScoreCache.set(cacheKey, score);
        return score;
      }
    } catch (error) {
      console.error("Error evaluating icon answers:", error);
      const score = this.evaluateIconAnswersLocally(iconAnswers);
      this.iconScoreCache.set(cacheKey, score);
      return score;
    }
  }

  /**
   * ローカルでのアイコン回答採点（フォールバック用）
   */
  private evaluateIconAnswersLocally(iconAnswers: string[]): string {
    const correctPatterns = [
      ["メニュー", "ハンバーガー", "三本線", "ナビ", "設定", "リスト"],
      ["共有", "シェア", "送信", "エクスポート", "転送", "外部"],
      ["コピー", "複製", "複写", "貼り付け", "クリップボード"],
      ["ダウンロード", "保存", "DL", "取得", "落とす"],
      ["ハート", "いいね", "お気に入り", "好き", "ライク", "愛", "ブックマーク"],
    ];
    
    let correctCount = 0;
    iconAnswers.forEach((answer, i) => {
      if (!answer || answer.trim() === "") {
        return; // 空の回答はカウントしない
      }
      const normalized = answer.toLowerCase().trim();
      if (correctPatterns[i].some((pattern) =>
        normalized.includes(pattern.toLowerCase())
      )) {
        correctCount++;
      }
    });
    
    const score = `${correctCount}/5`;
    console.log("📝 ローカル採点結果:", score);
    return score;
  }

  async generateUIConfig(answers: PreSurveyAnswers): Promise<GeminiResponseExtended> {
    // キャッシュをチェック
    const cacheKey = this.generateCacheKey(answers);
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      console.log("💾 キャッシュからUI設定を取得:", cached);
      return cached;
    }

    if (!this.apiKey) {
      console.warn("Gemini API key not found, using rule-based configuration");
      const config = this.generateRuleBasedConfig(answers);
      this.configCache.set(cacheKey, config);
      return config;
    }

    const prompt = this.buildPrompt(answers);
    console.log("📝 送信するプロンプト:", prompt);

    try {
      const response = await this.fetchWithRetry(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API リクエストエラー:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔍 完全なAPIレスポンス:", JSON.stringify(data, null, 2));

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        console.error("❌ レスポンステキストが見つかりません");
        throw new Error("No text in API response");
      }

      console.log("🤖 Gemini API レスポンステキスト:", generatedText);

      // JSONレスポンスをパース（UI 設定と presentation を含めて期待）
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("❌ JSONマッチングに失敗:", generatedText);
        throw new Error("No JSON found in response");
      }

      console.log("✅ 抽出されたJSON:", jsonMatch[0]);

      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log("📊 パースされたレスポンス:", JSON.stringify(parsedResponse, null, 2));
      
      const validatedResponse = this.validateResponse(parsedResponse);
      console.log("✨ バリデーション後の設定:", JSON.stringify(validatedResponse, null, 2));
      
      // キャッシュに保存
      this.configCache.set(cacheKey, validatedResponse);
      
      return validatedResponse;
    } catch (error) {
      console.error("❌ Gemini API呼び出しエラー:", error);
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message);
        console.error("スタックトレース:", error.stack);
      }
      console.log("🔄 ルールベースのフォールバックを使用");
      const config = this.generateRuleBasedConfig(answers);
      this.configCache.set(cacheKey, config);
      return config;
    }
  }

  private buildPrompt(answers: PreSurveyAnswers): string {
    // UI比較テストの結果を整形
    const comparisonResults = UI_COMPARISON_QUESTIONS.map((question) => {
      const userChoice = answers.ui_comparisons[question.questionId];
      const chosenOption = userChoice === "A" ? question.optionA : question.optionB;
      const notChosenOption = userChoice === "A" ? question.optionB : question.optionA;
      
      return {
        questionId: question.questionId,
        category: question.category,
        description: question.description,
        userChoice: userChoice,
        chosenOption: chosenOption.description,
        notChosenOption: notChosenOption.description,
      };
    });

    return `あなたはUI/UXの専門家です。ユーザーのUI比較テストとアイコンテストの結果に基づいて、最適なUI設定を提案してください。

# 入力データ（ユーザーの回答結果）

## UI比較テストの結果
ユーザーは10問のUI比較テストに回答しました。各質問で、2つのUIオプション（A or B）から操作しやすいと感じる方を選択しました。

${comparisonResults.map((result, index) => `
### 質問${index + 1}: ${result.description}
- **カテゴリー**: ${result.category}
- **ユーザーの選択**: オプション ${result.userChoice}
- **選択したUI**: ${result.chosenOption}
- **選択しなかったUI**: ${result.notChosenOption}
`).join('\n')}

## アイコンテストの結果
- **アイコン理解度スコア**: ${answers.icon_score}

## カテゴリーとUI設定の対応
各カテゴリーとUI設定の推奨値は以下の通りです：
${JSON.stringify(CATEGORY_TO_UI_MAPPING, null, 2)}

# 出力形式
以下の厳密なJSON形式で出力してください。説明文は含めず、JSONのみを出力してください。

{
  "layout": "standard" | "novice" | "expert",
  "text": "standard" | "novice" | "expert",
  "button": "standard" | "novice" | "expert",
  "input": "standard" | "novice" | "expert",
  "description": "standard" | "novice" | "expert",
  "presentation": {
    "global": "icon" | "text" | "icon_text",
    "buttons": {
      "menu": "icon" | "text" | "icon_text",
      "addTask": "icon" | "text" | "icon_text",
      "default": "icon" | "text" | "icon_text"
    }
  },
  "reasons": {
    "layout": "判断理由（ユーザーの選択を具体的に言及）",
    "text": "判断理由（ユーザーの選択を具体的に言及）",
    "button": "判断理由（ユーザーの選択を具体的に言及）",
    "input": "判断理由（ユーザーの選択を具体的に言及）",
    "description": "判断理由（ユーザーの選択を具体的に言及）",
    "presentation_global": "presentation.global（アイコンとテキストの全体的な表示方法）を選択した理由。アイコンスコアと関連する質問の選択を具体的に言及",
    "presentation_menu": "presentation.buttons.menu（メニューボタンの表示方法）を選択した理由。q8_menu_styleの選択を具体的に言及"
  }
}

# 判断方法

## 各設定値の意味
- **novice**: 初心者向け（大きなボタン、多めの説明、シンプルなレイアウト）
- **standard**: 標準（バランスの取れた設定）
- **expert**: 上級者向け（コンパクト、少ない説明、効率重視）

## 判断ロジック

1. **各カテゴリーでユーザーが選択したオプション**を確認
2. **CATEGORY_TO_UI_MAPPINGを参照**して、選択したオプションに対応するUI設定（novice/expert）を特定
3. **関連するカテゴリーの選択を統合**して、最終的なUI設定を決定
   - button_size, button_spacing → button設定
   - text_size, text_hierarchy → text設定
   - layout_density, card_design → layout設定
   - icon_presentation, menu_style → presentation設定
   - description_detail, input_label → description, input設定

4. **アイコンスコア**を参考にpresentation.globalを調整：
   - スコアが0-2/5: "text"（アイコン理解度が低い）
   - スコアが3/5: "icon_text"（中程度）
   - スコアが4-5/5: "icon" または "icon_text"（高い）

5. **presentation.buttons**の個別設定：
   - **menu**: q8_menu_style（メニューの表示）の選択を優先的に反映
     * optionA選択（アイコンのみ）→ "icon"
     * optionB選択（テキスト付き）→ "icon_text"
   - **addTask**: presentation.globalと同じ
   - **default**: presentation.globalと同じ

6. **一貫性を保つ**: 関連する設定は矛盾しないように調整

7. **reasons**には、各設定項目の判断理由を記載：
   - **layout, text, button, input, description**: ユーザーがどの質問でどのオプションを選んだかを具体的に記載
   - **presentation_global**: アイコンスコアと関連する質問（q7_icon_presentation）の選択を具体的に記載
   - **presentation_menu**: q8_menu_styleでの選択とその理由を具体的に記載

上記の方法に従って、ユーザーの一つの選択から判断せず、ユーザーの全ての選択を複合的に考えた合理的で一貫性のあるJSON設定を生成してください。
必ずJSONのみを出力し、前後に説明文を含めないでください。`;
  }

  /**
   * ボタンの表示方法（icon | text | icon_text）を事前アンケートから判断するための簡易プロンプトを作成
   * 注：新しいUI比較テスト形式では、このメソッドは使用されません。
   */
  buildPresentationPrompt(answers: PreSurveyAnswers, buttonKey?: string): string {
    const iconScore = answers.icon_score;
    const comparisons = JSON.stringify(answers.ui_comparisons);
    return `次のユーザーのUI比較テスト結果とアイコンスコアを参照し、ボタン（${buttonKey ?? 'default'}）の表示方法として最も適切だと判断するキーワードを1つだけ返してください。返す値の候補は: "icon", "text", "icon_text" のいずれかです。出力はそのキーワードのみとしてください。\n\nデータ:\n- icon_score: ${iconScore}\n- ui_comparisons: ${comparisons}\n`;
  }

  private validateResponse(response: unknown): GeminiResponseExtended {
    const validStyles = ["standard", "novice", "expert"];
    const requiredComponents = ["layout", "text", "button", "input", "description"];

    const validated: GeminiResponseExtended = {
      layout: "standard",
      text: "standard",
      button: "standard",
      input: "standard",
      description: "standard",
    };

    if (typeof response === "object" && response !== null) {
      const responseObj = response as Record<string, unknown>;

      console.log("🔍 バリデーション開始 - 受信したレスポンス:", responseObj);

      for (const component of requiredComponents) {
        const value = responseObj[component];
        console.log(`  ・${component}: ${value} (タイプ: ${typeof value})`);
        
        if (typeof value === "string" && validStyles.includes(value)) {
          validated[component as keyof GeminiResponse] = value as "standard" | "novice" | "expert";
          console.log(`    ✅ ${component} を ${value} に設定`);
        } else {
          console.warn(`    ⚠️ ${component} の値が無効: ${value} (デフォルトのstandardを使用)`);
        }
      }

      // presentation が含まれている場合は簡易検証して取り込む
      const pres = responseObj["presentation"];
      if (pres && typeof pres === "object") {
        try {
          const presObj = pres as Record<string, unknown>;
          console.log("🎨 presentation 設定を処理中:", presObj);
          
          const buttons = presObj.buttons && typeof presObj.buttons === "object" ? (presObj.buttons as Record<string, PresentationMode>) : { default: "icon" as PresentationMode };
          const global = (presObj.global as PresentationMode) || (presObj.default as PresentationMode) || ("icon" as PresentationMode);
          
          validated.presentation = { buttons, global } as PresentationConfig;
          console.log("  ✅ presentation 設定を適用:", validated.presentation);
        } catch (e) {
          console.warn("  ❌ presentation 設定の処理に失敗:", e);
        }
      } else {
        console.warn("  ⚠️ presentation 設定が見つかりません");
      }

      // reasons が含まれている場合は取り込む
      const reasons = responseObj["reasons"];
      if (reasons && typeof reasons === "object") {
        try {
          validated.reasons = reasons as Record<string, string>;
          console.log("📝 reasons を取り込みました:", validated.reasons);
        } catch (e) {
          console.warn("  ❌ reasons の処理に失敗:", e);
        }
      } else {
        console.warn("  ⚠️ reasons フィールドが見つかりません");
      }
    } else {
      console.error("❌ レスポンスが有効なオブジェクトではありません:", response);
    }

    console.log("✅ 最終的なバリデーション結果:", validated);
    return validated;
  }

  /**
   * ルールベースのUI設定生成（フォールバック用）
   * UI比較テストの結果から論理的にUI設定を生成
   */
  private generateRuleBasedConfig(answers: PreSurveyAnswers): GeminiResponseExtended {
    console.log("🔧 ルールベースのUI設定を生成中...");
    
    const iconScoreNum = this.parseIconScore(answers.icon_score);
    const comparisons = answers.ui_comparisons;
    
    // カテゴリーごとにスコアを集計（novice寄り=0, expert寄り=1）
    const categoryScores: Record<string, number[]> = {
      button: [],
      text: [],
      layout: [],
      presentation: [],
      description: [],
      input: [],
    };
    
    // UI_COMPARISON_QUESTIONSから各カテゴリーのスコアを計算
    UI_COMPARISON_QUESTIONS.forEach((question) => {
      const userChoice = comparisons[question.questionId];
      const mapping = (CATEGORY_TO_UI_MAPPING as Record<string, Record<string, string>>)[question.category];
      
      if (!mapping || !userChoice) return;
      
      const chosenStyle = mapping[`option${userChoice}`]; // "novice" or "expert"
      const score = chosenStyle === "expert" ? 1 : 0;
      
      // カテゴリーにマッピング
      if (question.category.includes("button")) {
        categoryScores.button.push(score);
      } else if (question.category.includes("text")) {
        categoryScores.text.push(score);
      } else if (question.category.includes("layout") || question.category.includes("card")) {
        categoryScores.layout.push(score);
      } else if (question.category.includes("icon") || question.category.includes("menu")) {
        categoryScores.presentation.push(score);
      } else if (question.category.includes("description")) {
        categoryScores.description.push(score);
      } else if (question.category.includes("input")) {
        categoryScores.input.push(score);
      }
    });
    
    // 各カテゴリーの平均スコアから設定を決定
    const determineStyle = (scores: number[]): "novice" | "standard" | "expert" => {
      if (scores.length === 0) return "standard";
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg <= 0.33) return "novice";
      if (avg >= 0.67) return "expert";
      return "standard";
    };
    
    const layout = determineStyle(categoryScores.layout);
    const text = determineStyle(categoryScores.text);
    const button = determineStyle(categoryScores.button);
    const input = determineStyle([...categoryScores.input, ...categoryScores.button]); // inputはbuttonと関連
    const description = determineStyle(categoryScores.description);
    
    // presentation.global: アイコンスコアとUI選択から判断
    let global: PresentationMode = "icon_text";
    const presentationScore = categoryScores.presentation.length > 0
      ? categoryScores.presentation.reduce((a, b) => a + b, 0) / categoryScores.presentation.length
      : 0.5;
    
    if (iconScoreNum <= 2) {
      global = "text";
    } else if (iconScoreNum === 3) {
      global = "icon_text";
    } else if (iconScoreNum >= 4) {
      // presentationScoreを参考に
      if (presentationScore >= 0.7) {
        global = "icon";
      } else {
        global = "icon_text";
      }
    }
    
    // menuボタンの設定：q8_menu_styleの選択を反映
    let menuPresentation: PresentationMode = "icon"; // デフォルトはアイコンのみ
    const menuStyleChoice = comparisons["q8_menu_style"];
    if (menuStyleChoice === "A") {
      // optionA: アイコンのみ
      menuPresentation = "icon";
    } else if (menuStyleChoice === "B") {
      // optionB: テキスト付き
      menuPresentation = "icon_text";
    }
    
    const presentation: PresentationConfig = {
      global,
      buttons: {
        menu: menuPresentation,
        addTask: global,
        default: global,
      },
    };
    
    const reasons = {
      layout: `レイアウト関連の質問でのユーザー選択から判断（平均スコア: ${categoryScores.layout.length > 0 ? (categoryScores.layout.reduce((a,b)=>a+b,0)/categoryScores.layout.length).toFixed(2) : 'N/A'}）`,
      text: `テキスト関連の質問でのユーザー選択から判断（平均スコア: ${categoryScores.text.length > 0 ? (categoryScores.text.reduce((a,b)=>a+b,0)/categoryScores.text.length).toFixed(2) : 'N/A'}）`,
      button: `ボタン関連の質問でのユーザー選択から判断（平均スコア: ${categoryScores.button.length > 0 ? (categoryScores.button.reduce((a,b)=>a+b,0)/categoryScores.button.length).toFixed(2) : 'N/A'}）`,
      input: `入力フィールド関連の質問でのユーザー選択から判断`,
      description: `説明文関連の質問でのユーザー選択から判断（平均スコア: ${categoryScores.description.length > 0 ? (categoryScores.description.reduce((a,b)=>a+b,0)/categoryScores.description.length).toFixed(2) : 'N/A'}）`,
      presentation_global: `アイコンスコア${answers.icon_score}（${iconScoreNum}/5点）とプレゼンテーション関連の質問から判断。スコアに基づき${global}を選択。`,
      presentation_menu: `q8_menu_style（メニューの表示）でオプション${menuStyleChoice ?? 'N/A'}を選択したため、${menuPresentation}に設定。`,
    };
    
    const config: GeminiResponseExtended = {
      layout,
      text,
      button,
      input,
      description,
      presentation,
      reasons,
    };
    
    console.log("✅ ルールベース設定を生成:", config);
    return config;
  }
  
  /**
   * アイコンスコア文字列から数値を抽出
   */
  private parseIconScore(scoreStr: string): number {
    const match = scoreStr.match(/(\d)\/5/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 3; // デフォルトは中程度
  }

  private getDefaultConfig(): GeminiResponse {
    const defaultConfig = {
      layout: "standard" as const,
      text: "standard" as const,
      button: "standard" as const,
      input: "standard" as const,
      description: "standard" as const,
    };
    console.log("⚠️ デフォルトUIConfigを使用:", defaultConfig);
    return defaultConfig;
  }
}

export const geminiService = new GeminiService();
