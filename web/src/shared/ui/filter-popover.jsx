"use client";

import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/shared/ui/dropdown-menu";

/**
 * Generic version of the "Sırala" popover from the dashboard home page
 * (SortPopover2026) — same trigger button, dropdown chrome, and selected-row
 * styling, parameterized so it can drive any single-select filter (category,
 * sort, etc.) instead of just sort criteria.
 *
 * Built on Radix DropdownMenu (via shared/ui/dropdown-menu) instead of a
 * hand-rolled mousedown-listener popover, so Escape-to-close, arrow-key
 * navigation, aria-expanded/aria-haspopup, and focus-return to the trigger
 * all come from Radix rather than being reimplemented here.
 */
export function FilterPopover2026({
  icon: Icon,
  prefixLabel,
  menuLabel,
  value,
  onChange,
  options,
}) {
  const currentOption = options.find((o) => o.id === value) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-2xl transition-all hover:border-white/20 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/60"
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-auto min-w-[12rem] max-h-80 overflow-y-auto border-white/15 bg-zinc-950/95 p-1.5 shadow-2xl ring-1 ring-white/10"
      >
        {menuLabel && <DropdownMenuLabel className="text-zinc-400">{menuLabel}</DropdownMenuLabel>}
        {options.map((opt) => {
          const OptIcon = opt.icon;
          const isSelected = opt.id === value;
          return (
            <DropdownMenuItem
              key={opt.id}
              onSelect={() => onChange(opt.id)}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium ${
                isSelected
                  ? "bg-violet-600/20 text-violet-200 font-semibold"
                  : "text-zinc-400 hover:text-zinc-100"
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
              {isSelected && <Check className="ms-3 h-3.5 w-3.5 text-violet-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
