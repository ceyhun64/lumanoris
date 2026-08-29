"use client";
import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown } from "lucide-react";

/**
 * Marka içi doğum tarihi seçici.
 *
 * Native <input type="date"> koyu temada okunamayan, biçimlendirilemeyen bir
 * takvim simgesiyle çiziliyor — bu yüzden giriş/kayıt formu kendi popover
 * takvimini yazmıştı. Aynı alan satıcı kaydı sihirbazında da var ve orası
 * hâlâ native input kullanıyordu; iki ekran aynı bilgiyi iki farklı görünümle
 * soruyordu. Bileşen buraya taşındı, ikisi de bunu kullanıyor.
 *
 * Değer ISO (yyyy-aa-gg) alır ve ISO döndürür; ekranda gg.aa.yyyy gösterir.
 * Stil sınıfları isteğe bağlı — verilmezse form alanlarıyla uyumlu
 * varsayılanlar kullanılır.
 */

const DEFAULT_WRAPPER_CLS = "relative group flex items-center w-full";
const DEFAULT_INPUT_CLS =
  "w-full bg-[#0A0B10]/80 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-body text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-fuchsia-500/50 focus:bg-[#0E0F16] focus:ring-4 focus:ring-fuchsia-500/10 hover:border-white/20 font-sans";
const DEFAULT_ICON_CLS =
  "absolute left-3.5 w-4 h-4 text-white/45 group-focus-within:text-fuchsia-400 transition-colors pointer-events-none z-10";

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const TR_DAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function MiniSelect({ value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const current = options.find((o) => o.value === value);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    // Capture phase + stopPropagation: this select can be opened while it's
    // nested inside BirthdatePicker's own popover, which has an identical
    // document-level Escape listener. Without this, one Escape press would
    // close both layers at once instead of just the innermost (this) one.
    function handleKeyDown(e) {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = ref.current?.querySelector('[data-selected="true"]');
    if (el) el.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white hover:border-white/20 hover:bg-white/[0.07] transition-colors"
      >
        <span>{current?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/40 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-10 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0E0F16] shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                close();
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                opt.value === value
                  ? "bg-fuchsia-600/20 text-fuchsia-300 font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom calendar dropdown for the birthdate field — native <input type="date">
// pickers render with an unstyleable, often barely-visible indicator on dark
// themes, so this replaces it with an in-brand popover. Kept as a top-level
// component (not nested inside AuthPage) so it isn't remounted — and its own
// open/view state lost — on every keystroke elsewhere in the form.
export function BirthdatePicker({
  value,
  onChange,
  inputCls = DEFAULT_INPUT_CLS,
  inputWrapperCls = DEFAULT_WRAPPER_CLS,
  fieldIconCls = DEFAULT_ICON_CLS,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const today = new Date();
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  const defaultView = parsed || new Date(today.getFullYear() - 20, 0, 1);
  const [viewYear, setViewYear] = useState(defaultView.getFullYear());
  const [viewMonth, setViewMonth] = useState(defaultView.getMonth());

  const closeCalendar = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") closeCalendar();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const years = [];
  for (let y = today.getFullYear(); y >= today.getFullYear() - 100; y -= 1) years.push(y);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first grid

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const displayLabel = parsed
    ? `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()}`
    : "";

  const isSelectedDay = (day) =>
    !!parsed &&
    parsed.getFullYear() === viewYear &&
    parsed.getMonth() === viewMonth &&
    parsed.getDate() === day;

  function pickDay(day) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    closeCalendar();
  }

  return (
    <div className={inputWrapperCls} ref={wrapRef}>
      <Calendar className={fieldIconCls} />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${inputCls} text-xs text-left`}
      >
        <span className={displayLabel ? "text-white" : "text-white/35"}>
          {displayLabel || "gg.aa.yyyy"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-white/10 bg-[#0A0B10] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-3">
            <MiniSelect
              value={viewMonth}
              onChange={setViewMonth}
              options={TR_MONTHS.map((m, i) => ({ value: i, label: m }))}
              className="flex-1"
            />
            <MiniSelect
              value={viewYear}
              onChange={setViewYear}
              options={years.map((y) => ({ value: y, label: String(y) }))}
              className="w-24"
            />
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {TR_DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-white/40 py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) =>
              day === null ? (
                <div key={`blank-${idx}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={`h-8 rounded-lg text-xs transition-colors ${
                    isSelectedDay(day)
                      ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
