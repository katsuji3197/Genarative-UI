"use client";

import React from "react";
import { UIConfig } from "@/types";

interface RightDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (page: string) => void;
  side?: "right" | "left";
  widthClass?: string;
  uiConfig?: UIConfig;
  children?: React.ReactNode;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

const RightDrawerMenu: React.FC<RightDrawerMenuProps> = ({ isOpen, onClose, onSelect, side = "right", widthClass = "w-80", children, onPointerEnter, onPointerLeave }) => {
  const isRight = side === "right";

  // keep component mounted while animating in/out
  const [visible, setVisible] = React.useState<boolean>(isOpen);
  // active controls whether the overlay/drawer are in their "on-screen" state
  const [active, setActive] = React.useState<boolean>(false);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rafId: number | undefined;
    if (isOpen) {
      setVisible(true);
      // trigger enter animation on next frame
      rafId = requestAnimationFrame(() => setActive(true));
    } else {
      // trigger exit animation then unmount after duration
      setActive(false);
      timer = setTimeout(() => setVisible(false), 200);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen]);

  if (!visible) return null;

  return (
    <>
      {/* Overlay (fade) */}
      <div
        aria-hidden={!active}
        onClick={onClose}
        className={`fixed inset-0 bg-neutral-100/50 backdrop-blur-sm transition-opacity duration-200 ${active ? 'opacity-100 pointer-events-auto z-40' : 'opacity-0 pointer-events-none z-0'}`}
        style={{ backdropFilter: 'blur(6px)' }}
      />

      {/* Drawer (slide) */}
      <aside
        role="dialog"
        aria-modal="true"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className={`fixed top-0 h-full ${widthClass} max-w-full bg-white shadow-xl transform transition-transform duration-200 ease-in-out ${isRight ? 'right-0' : 'left-0'} ${active ? 'translate-x-0 z-50' : (isRight ? 'translate-x-full z-40' : '-translate-x-full z-40')}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold">メニュー</h3>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">閉じる</button>
          </div>

          <nav className="p-4 flex-1 overflow-auto">
            {children ? (
              children
            ) : (
              <ul className="space-y-2">
                <li>
                  <button onClick={() => { onSelect?.('profile'); }} className="w-full text-left px-4 py-2 rounded hover:bg-gray-50">アカウント設定</button>
                </li>
                <li>
                  <button onClick={() => { onSelect?.('notifications'); }} className="w-full text-left px-4 py-2 rounded hover:bg-gray-50">通知設定</button>
                </li>
                <li>
                  <button onClick={() => { onSelect?.('help'); }} className="w-full text-left px-4 py-2 rounded hover:bg-gray-50">ヘルプ</button>
                </li>
                <li>
                  <button onClick={() => { onSelect?.('about'); }} className="w-full text-left px-4 py-2 rounded hover:bg-gray-50">このアプリについて</button>
                </li>
              </ul>
            )}
          </nav>

        </div>
      </aside>
    </>
  );
};

export default RightDrawerMenu;


