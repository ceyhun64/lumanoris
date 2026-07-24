"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

/**
 * Generic version of the "Sırala" popover from the dashboard home page
 * (SortPopover2026) — same trigger button, dropdown chrome, and selected-row
 * styling, parameterized so it can drive any single-select filter (category,
 * sort, etc.) instead of just sort criteria.
 */
export function FilterPopover2026({
  icon: Icon,
  prefixLabel,
  menuLabel,
  value,
  onChange,
  options,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentOption = options.find((o) => o.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-2xl transition-all hover:border-white/20 hover:bg-zinc-800 hover:text-white"
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-violet-400" />}
        {prefixLabel && (
          <span className="hidden sm:inline text-zinc-400 font-normal">
            {prefixLabel}
          </span>
        )}
        <span className="font-semibold text-white">
          {currentOption?.label}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 rounded-2xl border border-white/15 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
          {menuLabel && (
            <div className="px-2.5 py-2 text-caption font-bold uppercase tracking-wider text-zinc-400">
              {menuLabel}
            </div>
          )}
          <div className="max-h-80 space-y-0.5 overflow-y-auto">
            {options.map((opt) => {
              const OptIcon = opt.icon;
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                    isSelected
                      ? "bg-violet-600/20 text-violet-200 font-semibold border border-violet-500/30"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {OptIcon && (
                      <OptIcon
                        className={`h-3.5 w-3.5 ${isSelected ? "text-violet-400" : "text-zinc-400"}`}
                      />
                    )}
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="ms-3 h-3.5 w-3.5 text-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
