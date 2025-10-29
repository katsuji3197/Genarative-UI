"use client";

import React from "react";
import { UIConfig } from "@/types";
import personalizationConfig from "@/config/personalization.json";

interface LoadingScreenProps {
  uiConfig?: UIConfig;
  message?: string;
}

const getPersonalizedStyle = (
  uiConfig: UIConfig | undefined,
  component: keyof UIConfig
) => {
  if (!uiConfig) return "";
  return personalizationConfig[component][uiConfig[component]];
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  uiConfig,
  message = "読み込み中...",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div
        className={`bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4`}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center animate-pulse text-white text-xl font-bold">
          UI
        </div>
        <div
          className={`text-center text-gray-700 ${
            uiConfig ? getPersonalizedStyle(uiConfig, "text") : ""
          }`}
        >
          <div className="text-lg font-semibold">{message}</div>
          <div className="text-sm text-gray-500 mt-1">少々お待ちください</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
