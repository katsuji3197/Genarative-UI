import { PreSurveyAnswers, GeminiResponse, PresentationConfig, PresentationMode, TaskActionMode, GeminiResponseExtended } from "@/types";
import personalizationConfig from "@/config/personalization.json";

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

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    this.configCache = new Map();
    this.iconScoreCache = new Map();
  }

  /**
   * アンケート回答からキャッシュキーを生成
   */
  private generateCacheKey(answers: PreSurveyAnswers): string {
    return `${answers.q1_confidence}-${answers.q2_preference}-${answers.q3_text_issue}-${answers.q4_tap_error}-${answers.q5_priority}-${answers.q6_icon_score}`;
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
    const base: any = (personalizationConfig as any)["presentation"] || {};

    // start with defaults
    const result: PresentationConfig = {
      buttons: base.buttons || { default: (base.default as PresentationMode) || "icon" },
      global: (base.global as PresentationMode) || (base.default as PresentationMode) || "icon",
      taskAction: base.taskAction || { default: "inline", modes: ["inline", "menu", "icon-only"] },
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
          // promote taskAction to inline so labels show for edit/delete
          result.taskAction = { default: "inline", modes: ["inline", "menu", "icon-only"] };
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
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
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
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
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
    return `あなたはUI/UXの専門家です。ユーザーの事前アンケート結果に基づいて、最適なUI設定を提案してください。

# 入力データ（ユーザーの事前アンケート結果）
{
  "q1_confidence": ${answers.q1_confidence},
  "q2_preference": ${answers.q2_preference},
  "q3_text_issue": ${answers.q3_text_issue},
  "q4_tap_error": ${answers.q4_tap_error},
  "q5_priority": ${answers.q5_priority},
  "q6_icon_score": "${answers.q6_icon_score}"
}

# アンケート項目の正確な意味（重要：スケールの方向に注意）
- q1_confidence (1-5): デジタル機器操作への自信（5=とても自信がある、1=全く自信がない）
- q2_preference (1-5): 画面上の情報量の好み（1=情報量が多い方が好き、5=情報量が少ない方が好き）
- q3_text_issue (1-5): 文字サイズの見やすさ（1=小さい文字でも見やすい、5=大きい文字の方がいい）
- q4_tap_error (1-5): ボタンの押し間違いの頻度（1=ほとんど押し間違えない、5=よく押し間違える）
- q5_priority (1-5): 操作の優先順位（1=速さ重視、5=正確性重視）
- q6_icon_score: アイコン理解度テストの結果（X/5の形式、5点満点）

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
    },
    "taskAction": {
      "default": "inline" | "menu" | "icon-only",
      "modes": ["inline", "menu", "icon-only"]
    }
  },
  "reasons": {
    "layout": "判断理由",
    "text": "判断理由",
    "button": "判断理由",
    "input": "判断理由",
    "description": "判断理由",
    "presentation": "判断理由"
  }
}

# 詳細な判断基準

## 各設定値の意味
- **novice**: 初心者向け（大きなボタン、多めの説明、シンプルなレイアウト）
- **standard**: 標準（バランスの取れた設定）
- **expert**: 上級者向け（コンパクト、少ない説明、効率重視）

## 判断ロジック

### layout（レイアウトの複雑さ）
- **novice**: q1_confidence <= 2 または q2_preference >= 4（シンプル好き）
- **expert**: q1_confidence >= 4 かつ q2_preference <= 2（情報量多め好き）
- **standard**: それ以外

### text（テキストサイズ）
- **novice**: q3_text_issue >= 4（大きい文字が必要）
- **expert**: q3_text_issue <= 2（小さい文字でも問題ない）
- **standard**: それ以外

### button（ボタンサイズと押しやすさ）
- **novice**: q4_tap_error >= 4（よく押し間違える）
- **expert**: q4_tap_error <= 2（押し間違えない）
- **standard**: それ以外
- 注：button設定は personalization.json の buttonSize.plusButton で実際のスタイル（w-12 h-12など）に変換されます

### input（入力フィールド）
- **novice**: q4_tap_error >= 4 または q1_confidence <= 2
- **expert**: q4_tap_error <= 2 かつ q1_confidence >= 4
- **standard**: それ以外

### description（説明の詳細さ）
- **novice**: q1_confidence <= 2 または q5_priority >= 4（正確性重視）
- **expert**: q1_confidence >= 4 かつ q5_priority <= 2（速さ重視）
- **standard**: それ以外

### presentation.global（アイコンとテキストの表示）
アイコンスコアを解析：
- スコアが0-1/5: **"text"**（アイコン理解度が低い）
- スコアが2/5: **"text"**（まだ低い）
- スコアが3/5: **"icon_text"**（中程度、両方表示）
- スコアが4/5: **"icon_text"**（まずまず、両方表示が安全）
- スコアが5/5: **"icon"**（完璧、アイコンのみでOK）

ただし、q4_tap_error >= 4（よく押し間違える）の場合は、スコアに関わらず "icon_text" を推奨

### presentation.buttons（個別ボタンの表示）
- menu: "icon"（よく使う操作なのでアイコンで十分）
- addTask: presentation.global と同じ
- default: presentation.global と同じ

上記の基準に従って、合理的で一貫性のあるJSON設定を生成してください。
必ずJSONのみを出力し、前後に説明文を含めないでください。`;
  }

  /**
   * ボタンの表示方法（icon | text | icon_text）を事前アンケートから判断するための簡易プロンプトを作成
   */
  buildPresentationPrompt(answers: PreSurveyAnswers, buttonKey?: string): string {
    return `次のユーザー属性データを参照し、ボタン（${buttonKey ?? 'default'}）の表示方法として最も適切だと判断するキーワードを1つだけ返してください。返す値の候補は: "icon", "text", "icon_text" のいずれかです。出力はそのキーワードのみとしてください。\n\nデータ:\n- q1_confidence: ${answers.q1_confidence}\n- q2_preference: ${answers.q2_preference}\n- q3_text_issue: ${answers.q3_text_issue}\n- q4_tap_error: ${answers.q4_tap_error}\n- q5_priority: ${answers.q5_priority}\n- q6_icon_score: ${answers.q6_icon_score}\n`;
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
          const presObj = pres as Record<string, any>;
          console.log("🎨 presentation 設定を処理中:", presObj);
          
          const buttons = presObj.buttons && typeof presObj.buttons === "object" ? presObj.buttons : { default: "icon" };
          const global = presObj.global || presObj.default || "icon";
          const taskAction = presObj.taskAction || { default: "inline", modes: ["inline", "menu", "icon-only"] };
          
          validated.presentation = { buttons, global, taskAction } as PresentationConfig;
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
   * アンケート結果から論理的にUI設定を生成
   */
  private generateRuleBasedConfig(answers: PreSurveyAnswers): GeminiResponseExtended {
    console.log("🔧 ルールベースのUI設定を生成中...");
    
    const iconScoreNum = this.parseIconScore(answers.q6_icon_score);
    
    // layout: 自信度と情報量の好みから判断
    let layout: "novice" | "standard" | "expert" = "standard";
    if (answers.q1_confidence <= 2 || answers.q2_preference >= 4) {
      layout = "novice";
    } else if (answers.q1_confidence >= 4 && answers.q2_preference <= 2) {
      layout = "expert";
    }
    
    // text: 文字サイズの見やすさから判断
    let text: "novice" | "standard" | "expert" = "standard";
    if (answers.q3_text_issue >= 4) {
      text = "novice"; // 大きい文字が必要
    } else if (answers.q3_text_issue <= 2) {
      text = "expert"; // 小さい文字でもOK
    }
    
    // button: 誤タップの頻度から判断
    let button: "novice" | "standard" | "expert" = "standard";
    if (answers.q4_tap_error >= 4) {
      button = "novice"; // 大きなボタンが必要
    } else if (answers.q4_tap_error <= 2) {
      button = "expert"; // 小さなボタンでもOK
    }
    
    // input: 誤タップと自信度の組み合わせ
    let input: "novice" | "standard" | "expert" = "standard";
    if (answers.q4_tap_error >= 4 || answers.q1_confidence <= 2) {
      input = "novice";
    } else if (answers.q4_tap_error <= 2 && answers.q1_confidence >= 4) {
      input = "expert";
    }
    
    // description: 自信度と優先順位から判断
    let description: "novice" | "standard" | "expert" = "standard";
    if (answers.q1_confidence <= 2 || answers.q5_priority >= 4) {
      description = "novice"; // 詳細な説明が必要
    } else if (answers.q1_confidence >= 4 && answers.q5_priority <= 2) {
      description = "expert"; // 簡潔でOK
    }
    
    // presentation.global: アイコンスコアと誤タップから判断
    let global: PresentationMode = "icon_text";
    if (iconScoreNum <= 2) {
      global = "text";
    } else if (iconScoreNum === 3) {
      global = "icon_text";
    } else if (iconScoreNum === 4) {
      global = "icon_text"; // 安全のため両方表示
    } else if (iconScoreNum === 5) {
      global = "icon";
    }
    
    // 誤タップが多い場合は icon_text を強制
    if (answers.q4_tap_error >= 4 && global === "icon") {
      global = "icon_text";
    }
    
    const presentation: PresentationConfig = {
      global,
      buttons: {
        menu: "icon", // メニューは使用頻度が高いのでアイコンのみ
        addTask: global,
        default: global,
      },
      taskAction: {
        default: "inline" as TaskActionMode,
        modes: ["inline", "menu", "icon-only"] as TaskActionMode[],
      },
    };
    
    const reasons = {
      layout: `自信度${answers.q1_confidence}、情報量好み${answers.q2_preference}から判断`,
      text: `文字サイズの見やすさ${answers.q3_text_issue}から判断`,
      button: `誤タップ頻度${answers.q4_tap_error}から判断`,
      input: `誤タップ${answers.q4_tap_error}と自信度${answers.q1_confidence}の組み合わせ`,
      description: `自信度${answers.q1_confidence}と優先順位${answers.q5_priority}から判断`,
      presentation: `アイコンスコア${answers.q6_icon_score}と誤タップ頻度${answers.q4_tap_error}から判断`,
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
