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

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
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
    if (!this.apiKey) {
      console.warn("Gemini API key not found, using default scoring");
      return "0/5";
    }

    const prompt = `
以下のアイコンクイズの回答を評価してください。各アイコンについて、ユーザーの回答が意味的に正解かどうかを判定し、正解数を返してください。

アイコンと正解例：
1. ≡ (ハンバーガーメニューアイコン): メニュー、ハンバーガー、三本線、ナビゲーション、設定 など
2. ↗ (共有アイコン): 共有、シェア、送信、エクスポート、転送 など  
3. ⧉ (コピーアイコン): コピー、複製、複写、コピペ、クリップボード など
4. ↓ (ダウンロードアイコン): ダウンロード、保存、取得、落とす、DL など
5. ♡ (ハートアイコン): ハート、いいね、お気に入り、好き、ライク、愛 など

ユーザーの回答：
1. ハンバーガーメニュー → "${iconAnswers[0]}"
2. 共有 → "${iconAnswers[1]}" 
3. コピー → "${iconAnswers[2]}"
4. ダウンロード → "${iconAnswers[3]}"
5. ハート → "${iconAnswers[4]}"

正解数のみを「X/5」の形式で返してください（例：「3/5」）。
`;

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = data.candidates[0].content.parts[0].text.trim();

      console.log("🎯 アイコンクイズ採点結果:", result);
      console.log("📝 ユーザー回答:", iconAnswers);

      // 正解数の形式をチェック（例：「3/5」）
      const scoreMatch = result.match(/(\d)\/5/);
      if (scoreMatch) {
        return scoreMatch[0];
      } else {
        console.warn("Unexpected scoring format, using default");
        return "0/5";
      }
    } catch (error) {
      console.error("Error evaluating icon answers:", error);
      return "0/5";
    }
  }

  async generateUIConfig(answers: PreSurveyAnswers): Promise<GeminiResponseExtended> {
    if (!this.apiKey) {
      console.warn("Gemini API key not found, using default configuration");
      return this.getDefaultConfig();
    }

    const prompt = this.buildPrompt(answers);

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;

      console.log("🤖 Gemini API レスポンス:", generatedText);

      // JSONレスポンスをパース（UI 設定と presentation を含めて期待）
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        console.log("📊 パースされたUIConfig:", parsedResponse);
        return this.validateResponse(parsedResponse);
      }

      throw new Error("Invalid response format from Gemini API");
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return this.getDefaultConfig();
    }
  }

  private buildPrompt(answers: PreSurveyAnswers): string {
    return `
# 指示
以下はユーザーの事前アンケートの数値データです。与えられたデータのみを用いて、最適と思われるUI設定をJSONオブジェクトで返してください。

# 出力に含める項目
- "layout", "text", "button", "input", "description" にはそれぞれ "standard" | "novice" | "expert" のいずれかを設定してください。
- 必ず "presentation" オブジェクトを含めてください。presentation は少なくとも "global" ("icon" | "text" | "icon_text") と、特定ボタン用の "buttons" マップ (例: "menu", "addTask", "default") を持つこと。

# 入力データ
{
  "q1_confidence": ${answers.q1_confidence},
  "q2_preference": ${answers.q2_preference},
  "q3_text_issue": ${answers.q3_text_issue},
  "q4_tap_error": ${answers.q4_tap_error},
  "q5_priority": ${answers.q5_priority},
  "q6_icon_score": "${answers.q6_icon_score}"
}

# ルール
- 判断は提示データのみに基づき、追加の説明や実装ヒントは出力の外に書かないでください。
- 出力に余分な文章を含める場合でも、最後に必ず有効なJSONオブジェクトを返してください。

# 理由の出力 (Reasons)
- JSON内に必ず 'reasons' オブジェクトを含めてください。
- 'reasons' は各決定（例: "layout", "text", "presentation", 各ボタンキーなど）をキーとし、各決定の**簡潔な理由**を文字列で返してください。

# 例 (期待される形式、reasons を含む)
{
  "layout": "standard",
  "text": "expert",
  "button": "standard",
  "input": "standard",
  "description": "standard",
  "presentation": {
    "global": "icon_text",
    "buttons": { "menu": "icon", "addTask": "icon_text", "default": "icon_text" },
    "taskAction": { "default": "inline", "modes": ["inline","menu","icon-only"] }
  },
  "reasons": {
    "layout": "情報量は中程度で標準レイアウトが適切と判断",
    "text": "ユーザーは文字を読みやすいため小さめ中心",
    "presentation": "アイコン理解度と誤タップ傾向を総合し決定"
  }
}
`;
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

      for (const component of requiredComponents) {
        const value = responseObj[component];
        if (typeof value === "string" && validStyles.includes(value)) {
          validated[component as keyof GeminiResponse] = value as "standard" | "novice" | "expert";
        }
      }

      // presentation が含まれている場合は簡易検証して取り込む
      const pres = responseObj["presentation"];
      if (pres && typeof pres === "object") {
        try {
          const presObj = pres as Record<string, any>;
          const buttons = presObj.buttons && typeof presObj.buttons === "object" ? presObj.buttons : { default: "icon" };
          const global = presObj.global || presObj.default || "icon";
          const taskAction = presObj.taskAction || { default: "inline", modes: ["inline", "menu", "icon-only"] };
          validated.presentation = { buttons, global, taskAction } as PresentationConfig;
        } catch (e) {
          console.warn("Invalid presentation config in Gemini response, ignoring", e);
        }
      }
    }

    return validated;
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
