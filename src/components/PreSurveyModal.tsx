"use client";

import React, { useState } from "react";
import Image from "next/image";
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
import { UI_COMPARISON_QUESTIONS } from "@/constants/uiComparison";

interface PreSurveyModalProps {
  onSubmit: (answers: PreSurveyAnswers) => void;
}

export const PreSurveyModal: React.FC<PreSurveyModalProps> = ({ onSubmit }) => {
  // UI比較テストの回答を管理
  const [uiComparisons, setUiComparisons] = useState<Record<string, "A" | "B">>({});
  
  // アイコンテストの回答を管理
  const [iconTestAnswers, setIconTestAnswers] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentStep, setCurrentStep] = useState<"ui_comparison" | "icon_test">("ui_comparison");
  
  // UI比較テストの現在の質問番号（0始まり）
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const totalQuestions = UI_COMPARISON_QUESTIONS.length;
  const currentQuestion = UI_COMPARISON_QUESTIONS[currentQuestionIndex];

  // アイコンテスト用のアイコン配列
  const iconTestIcons = [
    { Icon: HiOutlineBars3 },
    { Icon: HiOutlineShare },
    { Icon: HiOutlineDocumentDuplicate },
    { Icon: HiOutlineArrowDownTray },
    { Icon: HiOutlineHeart },
  ];

  const handleUIComparisonChange = (questionId: string, value: "A" | "B") => {
    setUiComparisons((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleIconTestChange = (index: number, value: string) => {
    const newAnswers = [...iconTestAnswers];
    newAnswers[index] = value;
    setIconTestAnswers(newAnswers);
  };
  
  // 次の質問へ
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // 前の質問へ
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // 最後の質問でアイコンテストへ進む
  const handleNextToIconTest = () => {
    // 現在の質問に回答しているかチェック
    if (!uiComparisons[currentQuestion.questionId]) {
      alert("この質問にお答えください。");
      return;
    }
    
    setCurrentStep("icon_test");
  };
  
  // UI比較テストに戻る
  const handleBackToComparison = () => {
    setCurrentStep("ui_comparison");
    setCurrentQuestionIndex(totalQuestions - 1); // 最後の質問に戻る
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // アイコンクイズの回答をGemini APIで採点
    setIsEvaluating(true);
    try {
      console.log("🤖 アイコンクイズをGemini APIで採点中...");
      const iconScore = await geminiService.evaluateIconAnswers(
        iconTestAnswers
      );
      
      const finalAnswers: PreSurveyAnswers = {
        ui_comparisons: uiComparisons,
        icon_score: iconScore,
        icon_answers: iconTestAnswers,
      };
      
      console.log("✅ 採点完了:", iconScore);
      console.log("📊 最終回答:", finalAnswers);
      onSubmit(finalAnswers);
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
      
      const finalAnswers: PreSurveyAnswers = {
        ui_comparisons: uiComparisons,
        icon_score: fallbackScore,
        icon_answers: iconTestAnswers,
      };
      onSubmit(finalAnswers);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-[60vw] w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {currentStep === "ui_comparison" ? "UI比較アンケート" : "アイコンの質問"}
          </h2>

          {currentStep === "ui_comparison" ? (
            // UI比較アンケート（1問ずつ表示）
            <div className="space-y-6">
              {/* 進捗表示 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    質問 {currentQuestionIndex + 1} / {totalQuestions}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round((currentQuestionIndex / totalQuestions) * 100)}%
                  </span>
                </div>
                {/* プログレスバー */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentQuestionIndex / totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                どちらのUIが操作しやすいと感じるか選択してください。
              </p>

              {/* 現在の質問 */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {currentQuestion.description}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* オプション A */}
                  <div
                    onClick={() => handleUIComparisonChange(currentQuestion.questionId, "A")}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                      uiComparisons[currentQuestion.questionId] === "A"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* 画像表示 */}
                    <div className="w-full h-80 bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={currentQuestion.optionA.imagePath}
                        alt="オプション A"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* オプション B */}
                  <div
                    onClick={() => handleUIComparisonChange(currentQuestion.questionId, "B")}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                      uiComparisons[currentQuestion.questionId] === "B"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* 画像表示 */}
                    <div className="w-full h-80 bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={currentQuestion.optionB.imagePath}
                        alt="オプション B"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ナビゲーションボタン */}
              <div className={`flex pt-6 ${currentQuestionIndex === 0 ? 'justify-end' : 'justify-between'}`}>
                {/* 戻るボタン（1問目では非表示） */}
                {currentQuestionIndex > 0 && (
                  <AppButton
                    uiConfig={{
                      layout: "standard",
                      text: "standard",
                      button: "standard",
                      input: "standard",
                      description: "standard",
                    }}
                    onClick={handlePreviousQuestion}
                    variant="secondary"
                  >
                    戻る
                  </AppButton>
                )}

                {/* 次へボタン or アイコンテストへ */}
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <AppButton
                    uiConfig={{
                      layout: "standard",
                      text: "standard",
                      button: "standard",
                      input: "standard",
                      description: "standard",
                    }}
                    onClick={handleNextQuestion}
                    variant="primary"
                    disabled={!uiComparisons[currentQuestion.questionId]}
                  >
                    次へ
                  </AppButton>
                ) : (
                  <AppButton
                    uiConfig={{
                      layout: "standard",
                      text: "standard",
                      button: "standard",
                      input: "standard",
                      description: "standard",
                    }}
                    onClick={handleNextToIconTest}
                    variant="primary"
                    disabled={!uiComparisons[currentQuestion.questionId]}
                  >
                    次へ
                  </AppButton>
                )}
              </div>
            </div>
          ) : (
            // アイコンテスト
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  以下のアイコンが何を表しているか、テキストで入力してください。
                </p>
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

              <div className="flex justify-center gap-4 pt-6">
                <AppButton
                  uiConfig={{
                    layout: "standard",
                    text: "standard",
                    button: "standard",
                    input: "standard",
                    description: "standard",
                  }}
                  onClick={handleBackToComparison}
                  variant="secondary"
                  type="button"
                >
                  戻る
                </AppButton>
                <AppButton
                  uiConfig={{
                    layout: "standard",
                    text: "standard",
                    button: "standard",
                    input: "standard",
                    description: "standard",
                  }}
                  type="submit"
                  variant={isEvaluating ? "secondary" : "primary"}
                  disabled={isEvaluating}
                >
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
                      準備中...
                    </span>
                  ) : (
                    "回答を送信"
                  )}
                </AppButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
