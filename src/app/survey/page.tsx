"use client";

import React from "react";
import SurveyPair from "@/components/SurveyPair";
import useSurvey from "@/hooks/useSurvey";

export default function SurveyPage() {
  const { currentPair, currentIndex, total, recordAnswer, responses, isComplete } = useSurvey();

  async function handleSelect(pairId: string, choice: "A" | "B", rtMs: number) {
    recordAnswer(pairId, choice, rtMs);
    // TODO: ローカルのPOSTキューまたは進捗処理をここで行う
  }

  if (isComplete) {
    return (
      <div style={{ padding: 24 }}>
        <h2>アンケート完了</h2>
        <p>ご協力ありがとうございます。回答が保存されました。</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(responses, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>UI 比較アンケート</h2>
      <SurveyPair pair={currentPair} onSelect={handleSelect} index={currentIndex} total={total} />
    </div>
  );
}



