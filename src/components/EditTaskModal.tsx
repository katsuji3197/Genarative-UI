"use client";

import React, { useState, useEffect } from "react";
import { XIcon } from "@primer/octicons-react";
import AppButton from "./AppButton";
import { UIConfig, UIConfigWithPresentation } from "@/types";
import personalizationConfig from "@/config/personalization.json";

interface EditTaskModalProps {
  open: boolean;
  initialTitle: string;
  initialDescription?: string;
  uiConfig: UIConfigWithPresentation;
  onClose: () => void;
  onSave: (title: string, description?: string) => void;
  heading?: string;
}

const getPersonalizedStyle = (uiConfig: UIConfigWithPresentation, component: keyof UIConfig) => {
  return (personalizationConfig as any)[component][(uiConfig as any)[component]];
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ open, initialTitle, initialDescription = "", uiConfig, onClose, onSave, heading = 'タスクを編集' }) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
    }
  }, [open, initialTitle, initialDescription]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-neutral-100/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 transform transition-transform duration-200 scale-100 ${getPersonalizedStyle(uiConfig, 'layout')}`}>
        <div className="flex items-start justify-between mb-4">
          <h3 className={`font-semibold ${getPersonalizedStyle(uiConfig, 'text')}`}>{heading}</h3>
          <button aria-label="閉じる" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <XIcon size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full ${getPersonalizedStyle(uiConfig, 'input')} rounded-lg shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-200`}
            placeholder="タイトル"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full p-3 rounded-lg shadow-sm ring-1 h-24 ring-gray-100 focus:ring-2 focus:ring-blue-200 ${getPersonalizedStyle(uiConfig, 'input')}`}
            rows={5}
            placeholder="詳細（任意）"
          />
        </div>

        <div className="mt-6 flex justify-end items-center space-x-3">
          <AppButton variant="secondary" uiConfig={uiConfig} presentation={(uiConfig as any).presentation?.global ?? (personalizationConfig as any).presentation?.global}>
            キャンセル
          </AppButton>
          <AppButton variant="primary" uiConfig={uiConfig} presentation={(uiConfig as any).presentation?.global ?? (personalizationConfig as any).presentation?.global} onClick={() => onSave(title.trim() || initialTitle, description)}>
            保存する
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;


