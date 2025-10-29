"use client";

import React from "react";
import personalizationConfig from "@/config/personalization.json";
import { UIConfig, PresentationMode } from "@/types";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  uiConfig?: UIConfig;
  // presentation overrides how the button displays
  presentation?: PresentationMode; // icon | text | icon_text
}

const variantClass: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
  secondary: "bg-white text-gray-700 border border-gray-200",
  danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white",
  ghost: "bg-transparent text-gray-700",
};

export const AppButton: React.FC<AppButtonProps> = ({ variant = "primary", uiConfig, presentation, className = "", children, ...rest }) => {
  const personal = uiConfig ? personalizationConfig["button"][uiConfig.button] : "";
  const base = `inline-flex items-center justify-center px-4 py-2 min-w-6 cursor-pointer rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2`;

  // normalize children
  const childArray = React.Children.toArray(children);
  const hasElementChild = childArray.some((c) => React.isValidElement(c));
  const hasTextChild = childArray.some((c) => typeof c === "string" || typeof c === "number");

  const showText = presentation === "text" || presentation === "icon_text" || !presentation;

  // Render logic:
  // - If children contain element(s) (icons), always render those elements regardless of presentation.
  // - Render text children only when presentation permits text (showText === true).
  const renderedChildren = (
    <>
      {childArray.map((c, i) => {
        if (React.isValidElement(c)) return <React.Fragment key={i}>{c}</React.Fragment>;
        if ((typeof c === "string" || typeof c === "number") && showText) return <React.Fragment key={i}>{c}</React.Fragment>;
        return null;
      })}
      {/* If presentation === 'icon' and there were only text children, keep an accessible label */}
      {presentation === "icon" && !hasElementChild && hasTextChild ? <span className="sr-only">{childArray.filter(c => typeof c === 'string' || typeof c === 'number').join('')}</span> : null}
    </>
  );

  return (
    <button className={`${base} ${variantClass[variant]} ${personal} ${className}`} {...rest}>
      {renderedChildren}
    </button>
  );
};

export default AppButton;


