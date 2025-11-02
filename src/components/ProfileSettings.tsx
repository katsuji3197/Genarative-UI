"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftIcon, CheckIcon, PersonFillIcon } from "@primer/octicons-react";
import AppButton from "./AppButton";
import EditTaskModal from "./EditTaskModal";
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'email' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    console.log("⚙️ ProfileSettings - 適用中のUIConfig:", uiConfig);
  }, []); // プロフィール設定のマウント時に一度だけ実行

  // パーソナライズされたスタイルを取得
  const getPersonalizedStyle = (component: keyof UIConfig) => {
    return personalizationConfig[component][uiConfig[component]];
  };

  const handleEdit = (field: 'name' | 'email') => {
    setEditingField(field);
    setEditValue(field === 'name' ? formData.name : formData.email);
  };

  const handleSaveEdit = (title: string) => {
    if (!editingField) return;
    
    if (title.trim() === '') {
      alert(`${editingField === 'name' ? 'ユーザー名' : 'メールアドレス'}を入力してください。`);
      return;
    }

    const updatedData = { ...formData, [editingField]: title };
    setFormData(updatedData);
    setEditingField(null);
    setShowSuccessMessage(true);

    // ユーザー名変更の場合のみタスク完了を記録
    if (editingField === 'name') {
      onSaveUser(updatedData);
      onTaskComplete(true, 'username_change');
    } else {
      onSaveUser(updatedData);
    }

    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleCloseModal = () => {
    setEditingField(null);
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
            <div className={`flex items-center justify-center h-full ${getPersonalizedStyle("layout")}`}>
              <button
                onClick={handleBackClick}
                className="flex items-center justify-center h-full space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-4 pt-3"
              >
                <ArrowLeftIcon size={20} className="h-full" />
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
                    {editingField === 'name' ? 'ユーザー名を更新しました。' : 'メールアドレスを更新しました。'}
                  </span>
                </div>
              </div>
            )}

            <div className={`${getPersonalizedStyle("layout")}`}>
              {/* ユーザー名表示/編集 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    className={`block font-medium text-gray-700 ${getPersonalizedStyle(
                      "text"
                    )}`}
                  >
                    ユーザー名
                  </label>
                  <button 
                    className="text-cyan-900 hover:text-cyan-600 underline text-sm font-medium transition-colors cursor-pointer"
                    onClick={() => handleEdit('name')}
                  >
                    編集
                  </button>
                </div>
                <div
                  className={`text-gray-600 mb-2 ${getPersonalizedStyle(
                    "description"
                  )}`}
                >
                  表示名を変更することができます。
                </div>

                <div
                  className={`p-3 bg-gray-50 rounded border border-gray-200 ${getPersonalizedStyle(
                    "text"
                  )}`}
                >
                  {formData.name}
                </div>
              </div>

              {/* メールアドレス表示（編集可能） */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    className={`block font-medium text-gray-700 ${getPersonalizedStyle(
                      "text"
                    )}`}
                  >
                    メールアドレス
                  </label>
                  <button 
                    className="text-cyan-900 hover:text-cyan-600 underline text-sm font-medium transition-colors cursor-pointer"
                    onClick={() => handleEdit('email')}
                  >
                    編集
                  </button>
                </div>
                <div
                  className={`text-gray-600 mb-2 ${getPersonalizedStyle(
                    "description"
                  )}`}
                >
                  メールアドレスを変更することができます。
                </div>
                <div
                  className={`p-3 bg-gray-50 rounded border border-gray-200 text-gray-600 ${getPersonalizedStyle(
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
        <div className="mt-8">
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
              <li>1. 「編集」ボタンをクリックしてユーザー名またはメールアドレスを変更します</li>
              <li>2. 新しい情報を入力します</li>
              <li>3. 「保存する」ボタンをクリックして変更を保存します</li>
            </ol>
          </div>
        </div>
      </main>

      {/* 編集モーダル */}
      <EditTaskModal
        open={editingField !== null}
        initialTitle={editValue}
        initialDescription=""
        uiConfig={uiConfig}
        onClose={handleCloseModal}
        onSave={(title) => handleSaveEdit(title)}
        heading={editingField === 'name' ? 'ユーザー名を編集' : 'メールアドレスを編集'}
        showDescription={false}
      />
    </div>
  );
};
