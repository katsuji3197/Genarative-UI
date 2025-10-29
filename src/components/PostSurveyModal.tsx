"use client";

import React, { useState } from "react";
import AppButton from "./AppButton";
import { PostSurveyAnswers } from "@/types";

interface PostSurveyModalProps {
  onSubmit: (answers: PostSurveyAnswers) => void;
  // 追加: CSVダウンロード時にタスク一覧を渡す
  tasks?: import("@/types").Task[];
}

export const PostSurveyModal: React.FC<PostSurveyModalProps> = ({
  onSubmit,
}) => {
  const [answers, setAnswers] = useState<PostSurveyAnswers>({
    q1_seq: -1,
    q2_satisfaction: -1,
    q3_preference: -1,
    q4_comment: "",
  });

  const handleScaleChange = (
    question: keyof PostSurveyAnswers,
    value: number
  ) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleTextChange = (
    question: keyof PostSurveyAnswers,
    value: string
  ) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      answers.q1_seq === -1 ||
      answers.q2_satisfaction === -1 ||
      answers.q3_preference === -1
    ) {
      alert("すべての質問にお答えください。");
      return;
    }
    onSubmit(answers);
    // CSV ダウンロードは親が行う。ただし tasks を参照して必要なら処理可能。
  };

  return (
    <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            事後アンケート
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 質問1: 容易性評価 (SEQ) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                1. タスクはどれくらい簡単に感じましたか？
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">とても困難</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q1_seq"
                        value={value}
                        checked={answers.q1_seq === value}
                        onChange={() => handleScaleChange("q1_seq", value)}
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">とても簡単</span>
              </div>
            </div>

            {/* 質問2: 満足度評価 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                2. 操作全体の満足度はどれくらいですか？
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">とても不満</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q2_satisfaction"
                        value={value}
                        checked={answers.q2_satisfaction === value}
                        onChange={() =>
                          handleScaleChange("q2_satisfaction", value)
                        }
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">とても満足</span>
              </div>
            </div>

            {/* 質問3: UIの好み評価 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                3. この画面デザインの好みはどれくらいですか？
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm">とても嫌い</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="q3_preference"
                        value={value}
                        checked={answers.q3_preference === value}
                        onChange={() =>
                          handleScaleChange("q3_preference", value)
                        }
                        className="mr-1"
                      />
                    </label>
                  ))}
                </div>
                <span className="text-sm">とても好き</span>
              </div>
            </div>

            {/* 質問4: 自由記述 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                4.
                操作中に分かりにくかった点や改善点など、ご自由にお書きください。
              </h3>
              <textarea
                value={answers.q4_comment}
                onChange={(e) => handleTextChange("q4_comment", e.target.value)}
                placeholder="お気づきの点がありましたら、ご記入ください。"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>

            <div className="flex justify-center space-x-4 pt-6">
              <AppButton variant="primary" uiConfig={{ layout: 'standard', text: 'standard', button: 'standard', input: 'standard', description: 'standard' }} type="submit">実験を終了する</AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
