"use client";

import React, { useState } from "react";
import AppButton from "./AppButton";
import { PreSurveyAnswers } from "@/types";
import { geminiService } from "@/lib/gemini";
import {
  HiOutlineBars3,
  HiOutlineShare,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowDownTray,
  HiOutlineHeart,
} from "react-icons/hi2";

interface PreSurveyModalProps {
  onSubmit: (answers: PreSurveyAnswers) => void;
}

export const PreSurveyModal: React.FC<PreSurveyModalProps> = ({ onSubmit }) => {
  const [answers, setAnswers] = useState<PreSurveyAnswers>({
    q1_confidence: 0,
    q2_preference: 0,
    q3_text_issue: 0,
    q4_tap_error: 0,
    q5_priority: 0,
    q6_icon_score: "",
  });

  const [iconTestAnswers, setIconTestAnswers] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);

  const [isEvaluating, setIsEvaluating] = useState(false);

  // アイコンテスト用のアイコン配列
  const iconTestIcons = [
    { Icon: HiOutlineBars3 },
    { Icon: HiOutlineShare },
    { Icon: HiOutlineDocumentDuplicate },
    { Icon: HiOutlineArrowDownTray },
    { Icon: HiOutlineHeart },
  ];

  const handleScaleChange = (
    question: keyof PreSurveyAnswers,
    value: number
  ) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleIconTestChange = (index: number, value: string) => {
    const newAnswers = [...iconTestAnswers];
    newAnswers[index] = value;
    setIconTestAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      answers.q1_confidence === 0 ||
      answers.q2_preference === 0 ||
      answers.q3_text_issue === 0 ||
      answers.q4_tap_error === 0 ||
      answers.q5_priority === 0
    ) {
      alert("すべての質問にお答えください。");
      return;
    }

    // アイコンクイズの回答をGemini APIで採点
    setIsEvaluating(true);
    try {
      console.log("🤖 アイコンクイズをGemini APIで採点中...");
      const iconScore = await geminiService.evaluateIconAnswers(
        iconTestAnswers
      );
      const updatedAnswers = { ...answers, q6_icon_score: iconScore };
      console.log("✅ 採点完了:", iconScore);
      onSubmit(updatedAnswers);
    } catch (error) {
      console.error("Error evaluating icons:", error);
      // エラーの場合は簡易的なローカル採点にフォールバック
      const correctPatterns = [
        ["メニュー", "ハンバーガー", "三本線", "ナビ"],
        ["共有", "シェア", "送信"],
        ["コピー", "複製", "複写"],
        ["ダウンロード", "保存", "DL"],
        ["ハート", "いいね", "お気に入り", "好き", "ライク"],
      ];
      let correctCount = 0;
      iconTestAnswers.forEach((answer, i) => {
        const normalized = answer.toLowerCase().trim();
        if (correctPatterns[i].some((pattern) =>
          normalized.includes(pattern.toLowerCase())
        )) {
          correctCount++;
        }
      });
      const fallbackScore = `${correctCount}/5`;
      console.log("📝 フォールバック採点:", fallbackScore);
      const updatedAnswers = { ...answers, q6_icon_score: fallbackScore };
      onSubmit(updatedAnswers);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            事前アンケート
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 質問1: デジタル機器の操作への自信 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                1.
                デジタル機器（スマートフォン、パソコンなど）の操作に自信はありますか？
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">とても自信がある</span>
                <div className="flex space-x-2">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q1_confidence"
                        value={value}
                        checked={answers.q1_confidence === value}
                        onChange={() => handleScaleChange("q1_confidence", value)}
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">全く自信がない</span>
              </div>
            </div>

            {/* 質問2: 情報量に対する好み */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                2. 画面上の情報量について、どの程度好みますか？
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">情報量が多い</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q2_preference"
                        value={value}
                        checked={answers.q2_preference === value}
                        onChange={() => handleScaleChange("q2_preference", value)}
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">情報量が少ない</span>
              </div>
            </div>

            {/* 質問3: 文字サイズへの要求 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                3. 文字サイズについて、どの程度見やすいですか？
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">小さい文字でも見やすい</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q3_text_issue"
                        value={value}
                        checked={answers.q3_text_issue === value}
                        onChange={() => handleScaleChange("q3_text_issue", value)}
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">大きい文字の方がいい</span>
              </div>
            </div>

            {/* 質問4: 操作の正確性への意識 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                4. ボタンやリンクを押すとき、どの程度押し間違いをしますか？
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">ほとんど押し間違えない</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q4_tap_error"
                        value={value}
                        checked={answers.q4_tap_error === value}
                        onChange={() => handleScaleChange("q4_tap_error", value)}
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">よく押し間違える</span>
              </div>
            </div>

            {/* 質問5: 操作における優先順位 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                5. 操作において、どちらを重視しますか？
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">速さ重視</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q5_priority"
                        value={value}
                        checked={answers.q5_priority === value}
                        onChange={() => handleScaleChange("q5_priority", value)}
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">正確性重視</span>
              </div>
            </div>

            {/* 質問6: アイコンの理解度 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                6.
                以下のアイコンが何を表しているか、テキストで入力してください。
              </h3>
              <div className="space-y-4">
                {iconTestIcons.map((icon, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center border border-neutral-200">
                      <icon.Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <input
                      type="text"
                      value={iconTestAnswers[index]}
                      onChange={(e) => handleIconTestChange(index, e.target.value)}
                      placeholder="このアイコンが表すものを入力"
                      className="flex-1 p-2 border border-neutral-200 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <AppButton uiConfig={{ layout: 'standard', text: 'standard', button: 'standard', input: 'standard', description: 'standard' }} type="submit" variant={isEvaluating ? 'secondary' : 'primary'} disabled={isEvaluating}>
                {isEvaluating ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    採点中...
                  </span>
                ) : (
                  "回答を送信"
                )}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
