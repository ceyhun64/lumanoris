import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

// type "warning" is used for validation/error messages throughout the app
// (despite the name) — mapped to the same rose tone every other error
// surface uses (DeleteConfirmModal, toast destructive variant, etc.).
const TYPE_STYLES = {
    warning: "border-l-rose-400 bg-rose-500/10 text-rose-100",
    success: "border-l-emerald-400 bg-emerald-500/10 text-emerald-100",
};

const ICON_COLOR = {
    warning: "#FB7185",
    success: "#34D399",
};

export default function Alert({ message, onClose, type = "warning" }) {
    return (
        <div
            className={cn(
                "relative z-10 mt-4 flex animate-[fadeIn_0.2s] items-center rounded-xl border-l-4 px-4.5 py-3.5 text-sm font-medium shadow-[0_6px_36px_rgba(217,70,239,0.15)]",
                TYPE_STYLES[type] ?? TYPE_STYLES.warning,
            )}
        >
            <span className="mr-2.5 shrink-0" aria-hidden="true">
                <svg width="20" height="20" fill="none">
                    <circle cx="10" cy="10" r="10" fill={ICON_COLOR[type] ?? ICON_COLOR.warning} />
                    <path d="M10 5V11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="15" r="1" fill="#fff" />
                </svg>
            </span>
            <span className="flex-1">{message}</span>
            <Button
                onClick={onClose}
                tabIndex={-1}
                variant="ghost"
                size="icon"
                className="ml-3 h-auto w-auto p-0.5 text-lg leading-none text-current opacity-60 hover:bg-transparent hover:opacity-100"
            >
                ×
            </Button>
        </div>
    );
}
