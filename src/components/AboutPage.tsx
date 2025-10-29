"use client";

import React from "react";

interface AboutPageProps {
  onBack?: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900 mr-4">戻る</button>
              <h1 className="font-bold text-gray-900">このアプリについて</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">本アプリはUIパーソナライズ評価用のデモです。（ダミー画面）</p>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
