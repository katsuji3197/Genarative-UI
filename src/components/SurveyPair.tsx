"use client";

import React, { useEffect, useState } from "react";
import { VariantPair, StyleVariant } from "@/lib/styleVariants";

type Props = {
  pair: VariantPair;
  onSelect: (pairId: string, choice: "A" | "B", rtMs: number) => void;
  index: number;
  total: number;
};

function renderPreview(variant: StyleVariant) {
  const fontSizeMap = { small: "14px", medium: "16px", large: "20px" };
  const paddingMap = { small: "6px", medium: "10px", large: "14px" };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: paddingMap[variant.controlSize],
        fontSize: fontSizeMap[variant.fontSize],
        width: 280,
        height: 160,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "white",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600 }}>タイトル</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>アイコン</div>
      </div>
      <div style={{ color: "#444" }}>短い説明文。UIの見た目を比較してください。</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ padding: "6px 10px", borderRadius: 6 }}>ボタン</button>
        <input placeholder="入力" style={{ flex: 1, padding: "6px" }} />
      </div>
    </div>
  );
}

export const SurveyPair: React.FC<Props> = ({ pair, onSelect, index, total }) => {
  const [startTs, setStartTs] = useState<number>(() => Date.now());
  const [leftIsA] = useState<boolean>(() => Math.random() >= 0.5);

  useEffect(() => {
    setStartTs(Date.now());
  }, [pair.pairId]);

  function handleChoice(choice: "A" | "B") {
    const rtMs = Date.now() - startTs;
    onSelect(pair.pairId, choice, rtMs);
  }

  const leftVariant = leftIsA ? pair.A : pair.B;
  const rightVariant = leftIsA ? pair.B : pair.A;
  const leftLabel = leftIsA ? "A" : "B";
  const rightLabel = leftIsA ? "B" : "A";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        {index}/{total} — ペア {pair.pairId}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {renderPreview(leftVariant)}
          <button onClick={() => handleChoice(leftLabel as "A" | "B")} aria-label={`選択 ${leftLabel}`}>
            {leftLabel} を選ぶ
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {renderPreview(rightVariant)}
          <button onClick={() => handleChoice(rightLabel as "A" | "B")} aria-label={`選択 ${rightLabel}`}>
            {rightLabel} を選ぶ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPair;



