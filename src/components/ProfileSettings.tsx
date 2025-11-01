"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftIcon, CheckIcon, PersonFillIcon } from "@primer/octicons-react";
import AppButton from "./AppButton";
import { UIConfig, User } from "@/types";
import personalizationConfig from "@/config/personalization.json";

interface ProfileSettingsProps {
  uiConfig: UIConfig;
  user: User;
  onBackClick: () => void;
  onSaveUser: (user: User) => void;
  onTaskComplete: (success: boolean, taskId?: string) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  uiConfig,
  user,
  onBackClick,
  onSaveUser,
  onTaskComplete,
}) => {
  const [formData, setFormData] = useState<User>({
    ...user,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    console.log("⚙️ ProfileSettings - 適用中のUIConfig:", uiConfig);
  }, []); // プロフィール設定のマウント時に一度だけ実行

  // パーソナライズされたスタイルを取得
  const getPersonalizedStyle = (component: keyof UIConfig) => {
    return personalizationConfig[component][uiConfig[component]];
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (formData.name.trim() === "") {
      alert("ユーザー名を入力してください。");
      return;
    }

    onSaveUser(formData);
    setIsEditing(false);
    setShowSuccessMessage(true);

    // タスク完了を記録（ユーザー名変更タスクのIDは 'username_change' として扱う）
    onTaskComplete(true, 'username_change');

    // 成功メッセージを3秒後に非表示
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleCancel = () => {
    setFormData({ ...user });
    setIsEditing(false);
  };

  const handleBackClick = () => {
    onBackClick();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center h-16`}> 
            <div className={`flex items-center ${getPersonalizedStyle("layout")}`}>
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeftIcon size={20} />
                <span className={`${getPersonalizedStyle("text")}`}>戻る</span>
              </button>
              <h1 className={`font-bold text-gray-900 ${getPersonalizedStyle("text")}`}>
                プロフィール設定
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-gray-600 ${getPersonalizedStyle("text")}`}>{formData.name || user.name}</span>
              <PersonFillIcon size={24} />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className={`bg-white rounded-2xl shadow-2xl ${getPersonalizedStyle(
            "layout"
          )}`}
        >
          <div className="p-6">
            {/* 成功メッセージ */}
            {showSuccessMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckIcon size={20} className="text-green-600 mr-2" />
                  <span
                    className={`text-green-800 font-medium ${getPersonalizedStyle(
                      "text"
                    )}`}
                  >
                    ユーザー名を更新しました。
                  </span>
                </div>
              </div>
            )}

            <div className={`${getPersonalizedStyle("layout")}`}>
              {/* ユーザー名表示/編集 */}
              <div>
                <label
                  className={`block font-medium text-gray-700 mb-2 ${getPersonalizedStyle(
                    "text"
                  )}`}
                >
                  ユーザー名
                </label>
                <div
                  className={`text-gray-600 mb-2 ${getPersonalizedStyle(
                    "description"
                  )}`}
                >
                  表示名を変更することができます。
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`w-full ${getPersonalizedStyle(
                        "input"
                      )} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg`}
                      placeholder="ユーザー名を入力してください"
                    />
                    <div className="flex space-x-2">
                      <AppButton variant="primary" uiConfig={uiConfig} onClick={handleSave}>保存</AppButton>
                      <AppButton variant="secondary" uiConfig={uiConfig} onClick={handleCancel}>キャンセル</AppButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      className={`p-3 bg-gray-50 rounded border ${getPersonalizedStyle(
                        "text"
                      )}`}
                    >
                      {formData.name}
                    </div>
                    <AppButton variant="primary" uiConfig={uiConfig} onClick={handleEdit}>編集</AppButton>
                  </div>
                )}
              </div>

              {/* メールアドレス表示（読み取り専用） */}
              <div>
                <label
                  className={`block font-medium text-gray-700 mb-2 ${getPersonalizedStyle(
                    "text"
                  )}`}
                >
                  メールアドレス
                </label>
                <div
                  className={`text-gray-600 mb-2 ${getPersonalizedStyle(
                    "description"
                  )}`}
                >
                  メールアドレスは変更できません。
                </div>
                <div
                  className={`p-3 bg-gray-50 rounded border text-gray-600 ${getPersonalizedStyle(
                    "text"
                  )}`}
                >
                  {formData.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 説明文 */}
        <div className={`mt-8 ${getPersonalizedStyle("description")}`}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3
              className={`font-semibold text-blue-900 mb-2 ${getPersonalizedStyle(
                "text"
              )}`}
            >
              操作手順
            </h3>
            <ol
              className={`text-blue-800 ${getPersonalizedStyle(
                "text"
              )} space-y-1`}
            >
              <li>1. 「編集」ボタンをクリックしてユーザー名を変更します</li>
              <li>2. 新しいユーザー名を入力します</li>
              <li>3. 「保存」ボタンをクリックして変更を保存します</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
};
