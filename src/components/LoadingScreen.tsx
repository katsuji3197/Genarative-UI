"use client";

import React from "react";

interface LoadingScreenProps {
  isUIReady?: boolean;
  onStartExperiment?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isUIReady = false,
  onStartExperiment,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 p-8 relative">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-10 space-y-8">
        {/* 感謝メッセージ */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            アンケートにご協力いただき、<br />ありがとうございました！
          </h1>
          <p className="text-lg text-gray-600">
            あなたに最適化されたUIを構築しています
          </p>
        </div>

        {/* UI構築状態インジケーター */}
        <div className="flex items-center justify-center space-x-3 py-4">
          {isUIReady ? (
            <>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-green-600 font-semibold">
                UI構築完了 - 実験を開始できます
              </span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-blue-600 font-semibold animate-pulse">
                UI構築中...
              </span>
            </>
          )}
        </div>

        {/* 実験の説明 */}
        <div className="space-y-6 bg-gray-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-500 pb-2">
            実験について
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <span className="mr-2 text-indigo-500">📋</span>
                実験タスクについて
              </h3>
              <p className="text-gray-600 leading-relaxed ml-7">
                実験タスクを全て完了することで、実験が終了します。
                各タスクは順番に表示されますので、一つずつ丁寧に取り組んでください。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <span className="mr-2 text-indigo-500">👈</span>
                残りタスクの確認方法
              </h3>
              <p className="text-gray-600 leading-relaxed ml-7">
                残りの実験タスクを確認したい場合は、画面の左端にマウスカーソルを持っていくことで、
                タスク一覧を表示できます。進捗状況もそこで確認できます。
                この画面でタスクの種類と挙動を確認しておいてください。
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <span className="mr-2 text-indigo-500">💡</span>
                実験中のサポート
              </h3>
              <p className="text-gray-600 leading-relaxed ml-7">
                実験中にわからないことがあったら、気軽に質問してください。
                あなたのペースで進めていただいて問題ありません。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 実験開始ボタン（右下固定） */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={onStartExperiment}
          disabled={!isUIReady}
          className={`
            px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 transform
            ${
              isUIReady
                ? "bg-linear-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:scale-105 hover:shadow-3xl cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
            }
          `}
        >
          {isUIReady ? (
            <span className="flex items-center space-x-2">
              <span>🚀 実験を開始</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <svg
                className="animate-spin h-5 w-5"
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
              <span>UI構築中...</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoadingScreen;
