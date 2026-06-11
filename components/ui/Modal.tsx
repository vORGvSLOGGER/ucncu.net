"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-base glow-teal w-full max-w-md p-5 animate-toast-in max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted transition hover:text-ink" aria-label="إغلاق">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
