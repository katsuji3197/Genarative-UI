"use client";

import React from "react";
import { XIcon } from "@primer/octicons-react";
import AppButton from "./AppButton";
import { UIConfig } from "@/types";
import personalizationConfig from "@/config/personalization.json";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  uiConfig: UIConfig;
  onCancel: () => void;
  onConfirm: () => void;
}

const getPersonalizedStyle = (uiConfig: UIConfig, component: keyof UIConfig) => {
  return personalizationConfig[component][uiConfig[component]];
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title = '確認', message, uiConfig, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-neutral-100/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-gray-0`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-semibold ${getPersonalizedStyle(uiConfig, 'text')}`}>{title}</h3>
          <button aria-label="閉じる" onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <XIcon size={16} />
          </button>
        </div>
        <p className={`text-gray-700 ${getPersonalizedStyle(uiConfig, 'description')}`}>{message}</p>
        <div className="mt-6 flex justify-end items-center space-x-3">
          <AppButton variant="secondary" uiConfig={uiConfig} onClick={onCancel}>キャンセル</AppButton>
          <AppButton variant="danger" uiConfig={uiConfig} onClick={onConfirm}>削除する</AppButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


