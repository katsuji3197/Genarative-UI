import React from "react";

export type ButtonType = "iconOnly" | "iconWithLabel" | "labelOnly";

export type StyleVariant = {
  fontSize: "small" | "medium" | "large";
  density: "compact" | "normal" | "spacious";
  controlSize: "small" | "medium" | "large";
  buttonType: ButtonType;
  layout: "single-column" | "two-column" | "card";
  notes?: string;
};

export type VariantPair = {
  pairId: string;
  axis: string[]; // which axes differ in this pair
  A: StyleVariant;
  B: StyleVariant;
};

// 10静的ペア定義。必要に応じて値を増やしてください。
export const STYLE_PAIRS: VariantPair[] = [
  {
    pairId: "p01",
    axis: ["fontSize"],
    A: { fontSize: "small", density: "normal", controlSize: "medium", buttonType: "iconWithLabel", layout: "single-column" },
    B: { fontSize: "large", density: "normal", controlSize: "medium", buttonType: "iconWithLabel", layout: "single-column" },
  },
  {
    pairId: "p02",
    axis: ["density"],
    A: { fontSize: "medium", density: "compact", controlSize: "small", buttonType: "iconWithLabel", layout: "single-column" },
    B: { fontSize: "medium", density: "spacious", controlSize: "large", buttonType: "iconWithLabel", layout: "single-column" },
  },
  {
    pairId: "p03",
    axis: ["controlSize"],
    A: { fontSize: "medium", density: "normal", controlSize: "small", buttonType: "iconWithLabel", layout: "single-column" },
    B: { fontSize: "medium", density: "normal", controlSize: "large", buttonType: "iconWithLabel", layout: "single-column" },
  },
  {
    pairId: "p04",
    axis: ["buttonType"],
    A: { fontSize: "medium", density: "normal", controlSize: "medium", buttonType: "iconOnly", layout: "single-column" },
    B: { fontSize: "medium", density: "normal", controlSize: "medium", buttonType: "iconWithLabel", layout: "single-column" },
  },
  {
    pairId: "p05",
    axis: ["layout"],
    A: { fontSize: "medium", density: "normal", controlSize: "medium", buttonType: "iconWithLabel", layout: "single-column" },
    B: { fontSize: "medium", density: "normal", controlSize: "medium", buttonType: "iconWithLabel", layout: "two-column" },
  },
  {
    pairId: "p06",
    axis: ["fontSize", "density"],
    A: { fontSize: "small", density: "compact", controlSize: "small", buttonType: "iconOnly", layout: "card" },
    B: { fontSize: "large", density: "spacious", controlSize: "large", buttonType: "iconWithLabel", layout: "card" },
  },
  {
    pairId: "p07",
    axis: ["controlSize", "buttonType"],
    A: { fontSize: "medium", density: "normal", controlSize: "small", buttonType: "labelOnly", layout: "single-column" },
    B: { fontSize: "medium", density: "normal", controlSize: "large", buttonType: "iconWithLabel", layout: "single-column" },
  },
  {
    pairId: "p08",
    axis: ["density", "layout"],
    A: { fontSize: "medium", density: "compact", controlSize: "small", buttonType: "iconWithLabel", layout: "two-column" },
    B: { fontSize: "medium", density: "spacious", controlSize: "large", buttonType: "iconWithLabel", layout: "card" },
  },
  {
    pairId: "p09",
    axis: ["fontSize", "buttonType"],
    A: { fontSize: "small", density: "normal", controlSize: "small", buttonType: "iconOnly", layout: "single-column" },
    B: { fontSize: "large", density: "normal", controlSize: "large", buttonType: "labelOnly", layout: "single-column" },
  },
  {
    pairId: "p10",
    axis: ["density", "controlSize", "buttonType"],
    A: { fontSize: "small", density: "compact", controlSize: "small", buttonType: "iconOnly", layout: "card" },
    B: { fontSize: "large", density: "spacious", controlSize: "large", buttonType: "iconWithLabel", layout: "card" },
  },
];

export default STYLE_PAIRS;



