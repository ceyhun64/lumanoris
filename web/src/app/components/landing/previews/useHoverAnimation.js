"use client";

import { useEffect, useRef } from "react";

/**
 * Altı özellik kartındaki interaktif önizlemenin ortak altyapısı.
 *
 * Kaynak HTML'de bu mantık `document.querySelectorAll('[data-hover-animation]')`
 * üzerinde tek bir IIFE olarak çalışıyordu; her kart için ayrı bir kapanış,
 * hiç temizlik yoktu ve `runXLoop()` sonsuza kadar kendini yeniden çağırıyordu
 * (sayfa gizlendiğinde bile). Buradaki fark:
 *
 *   • Her şey bileşenin kendi ref'ine kapsanmış — `document` sorgusu yok.
 *   • Her `setTimeout`/`requestAnimationFrame` kayıtlı; unmount'ta iptal
 *     ediliyor. `wait()` iptal edildiğinde Promise asla resolve etmiyor,
 *     böylece döngü unmount'tan sonra bir adım daha ilerlemiyor.
 *   • `prefers-reduced-motion` açıksa döngü hiç başlamıyor; sahne ilk
 *     aşamasında duruyor.
 *
 * `runLoop` async bir fonksiyon ve şu kontrol nesnesini alıyor:
 *   { preview, cursor, wait, moveCursor, press, isHovering, isCancelled }
 */
export function useHoverAnimation(runLoop, { pauseWhenNotHovered = true } = {}) {
  const cardRef = useRef(null);
  const runLoopRef = useRef(runLoop);
  runLoopRef.current = runLoop;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const preview = card.querySelector("[data-animation-preview]");
    if (!preview) return;

    const cursor = preview.querySelector("[data-animation-cursor]");

    let cancelled = false;
    const timers = new Set();
    let rafId = null;
    let cursorToken = 0;
    let cursorX = 0;
    let cursorY = 0;

    const later = (fn, ms) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, ms);
      timers.add(id);
      return id;
    };

    const isHovering = () => card.classList.contains("is-hovering");

    /* Kaynaktaki `waitWhileHovered`: süre yalnızca fare kartın üzerindeyken
       ilerliyor, böylece kullanıcı ayrıldığında sahne olduğu yerde donuyor.
       Kaynak bunu her bekleyiş için ayrı bir `setTimeout(tick, 16)` zinciriyle
       yapıyordu ve zincir hover olmasa da sonsuza kadar dönüyordu: altı kart =
       saniyede ~360 boşa callback, sayfa görünmezken bile.
       Burada tek bir rAF ticker var ve YALNIZCA gerçekten zaman işlerken
       çalışıyor; hover bitince kendini durduruyor, mouseenter yeniden
       başlatıyor. Sekme arka plandayken rAF zaten durduğu için döngüler
       kendiliğinden donuyor. */
    const pendingWaits = new Set();
    let tickHandle = null;
    let lastTick = 0;

    const shouldTick = () => pendingWaits.size > 0 && (!pauseWhenNotHovered || isHovering());

    const startTicking = () => {
      if (tickHandle !== null || cancelled || !shouldTick()) return;
      lastTick = performance.now();
      const tick = (now) => {
        tickHandle = null;
        if (cancelled) return;
        const delta = now - lastTick;
        lastTick = now;
        for (const waiter of [...pendingWaits]) {
          waiter.remaining -= delta;
          if (waiter.remaining <= 0) {
            pendingWaits.delete(waiter);
            waiter.resolve();
          }
        }
        if (shouldTick()) tickHandle = requestAnimationFrame(tick);
      };
      tickHandle = requestAnimationFrame(tick);
    };

    const wait = (duration) =>
      new Promise((resolve) => {
        if (cancelled) return;
        pendingWaits.add({ remaining: duration, resolve });
        startTicking();
      });

    /* İmleci hedefin merkezine yumuşakça taşır. Her çağrı bir "token" alır;
       yeni bir hareket başladığında eskisi sessizce ölür (kaynaktaki
       `cursor.dataset.animationId` mekanizmasının aynısı). */
    const tweenCursor = (x, y, duration = 850) =>
      new Promise((resolve) => {
        if (cancelled || !cursor) return resolve();
        const token = ++cursorToken;
        const startX = cursorX;
        const startY = cursorY;
        const startedAt = performance.now();

        const frame = (now) => {
          if (cancelled || token !== cursorToken) return resolve();
          const progress = Math.min((now - startedAt) / duration, 1);
          cursorX = startX + (x - startX) * progress;
          cursorY = startY + (y - startY) * progress;
          cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
          if (progress < 1) rafId = requestAnimationFrame(frame);
          else resolve();
        };
        rafId = requestAnimationFrame(frame);
      });

    const moveCursor = async (target, entryPoint) => {
      if (!target || !cursor) return;
      const bounds = preview.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const maxX = Math.max(0, bounds.width - cursor.clientWidth);
      const maxY = Math.max(0, bounds.height - cursor.clientHeight);

      const x = Math.min(
        Math.max(targetBounds.left - bounds.left + targetBounds.width / 2 - 4 * (cursor.clientWidth / 32), 0),
        maxX,
      );
      const y = Math.min(
        Math.max(targetBounds.top - bounds.top + targetBounds.height / 2 - 3.5 * (cursor.clientHeight / 42), 0),
        maxY,
      );

      if (entryPoint) {
        cursorX = Math.min(Math.max(entryPoint.x, 0), maxX);
        cursorY = Math.min(Math.max(entryPoint.y, 0), maxY);
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      }

      await tweenCursor(x, y);
    };

    /* Kısa "basıldı" görselini yönetir; aynı hedefe üst üste basıldığında
       önceki zamanlayıcı iptal edilir (kaynakla aynı davranış). */
    const pressTimers = new WeakMap();
    const press = (target, duration = 140) => {
      if (!target) return;
      const existing = pressTimers.get(target);
      if (existing) {
        window.clearTimeout(existing);
        timers.delete(existing);
      }
      target.classList.add("is-pressed");
      const id = later(() => target.classList.remove("is-pressed"), duration);
      pressTimers.set(target, id);
    };

    /* Fare kartın hangi kenarından girdiyse imleç oradan içeri süzülür. */
    const getEntryPoint = (event) => {
      if (!cursor) return null;
      const cardBounds = card.getBoundingClientRect();
      const previewBounds = preview.getBoundingClientRect();
      const { width: cw, height: ch } = cursor.getBoundingClientRect();
      const cardX = event.clientX - cardBounds.left;
      const cardY = event.clientY - cardBounds.top;
      const distances = {
        left: cardX,
        right: cardBounds.width - cardX,
        top: cardY,
        bottom: cardBounds.height - cardY,
      };
      const side = Object.keys(distances).reduce((a, b) => (distances[b] < distances[a] ? b : a), "left");
      const pointerX = Math.max(0, Math.min(previewBounds.width, event.clientX - previewBounds.left));
      const pointerY = Math.max(0, Math.min(previewBounds.height, event.clientY - previewBounds.top));

      return {
        x: Math.min(
          Math.max(side === "left" ? 0 : side === "right" ? previewBounds.width - cw : pointerX, 0),
          Math.max(0, previewBounds.width - cw),
        ),
        y: Math.min(
          Math.max(side === "top" ? 0 : side === "bottom" ? previewBounds.height - ch : pointerY, 0),
          Math.max(0, previewBounds.height - ch),
        ),
      };
    };

    /* ── Hover görselleri ── */
    const onEnter = (event) => {
      card.classList.add("is-hovering", "has-played");
      card.classList.remove("is-cursor-exiting");
      preview.classList.remove("is-paused");
      preview.style.removeProperty("filter");
      preview.style.removeProperty("opacity");
      if (cursor) {
        cursor.style.visibility = "visible";
        cursor.style.setProperty("opacity", "1", "important");
        const entry = getEntryPoint(event);
        if (entry) {
          cursorX = entry.x;
          cursorY = entry.y;
          cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        }
      }
      // Hover sırasında duran ticker'ı yeniden başlat.
      startTicking();
    };

    const onMove = (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--card-tilt-x", `${(x - 0.5) * 8}deg`);
      card.style.setProperty("--card-tilt-y", `${(0.5 - y) * 8}deg`);
      card.style.setProperty("--card-shadow-x", `${(0.5 - x) * 22}px`);
      card.style.setProperty("--card-shadow-y", `${18 + (y - 0.5) * 24}px`);
    };

    const onLeave = () => {
      cursorToken += 1;
      card.classList.remove("is-hovering");
      card.classList.add("has-played", "is-cursor-exiting");
      preview.classList.add("is-paused");
      preview.style.setProperty("filter", "brightness(0.65)", "important");
      preview.style.setProperty("opacity", "0.85", "important");
      if (cursor) cursor.style.setProperty("opacity", "0", "important");
      later(() => {
        if (!card.classList.contains("is-hovering")) {
          card.classList.remove("is-cursor-exiting");
          if (cursor) {
            cursor.style.visibility = "hidden";
            cursor.style.removeProperty("opacity");
          }
        }
      }, 220);
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
      card.style.setProperty("--card-shadow-x", "0px");
      card.style.setProperty("--card-shadow-y", "18px");
    };

    card.addEventListener("mouseenter", onEnter);
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);

    // Başlangıç durumu: sahne sönük ve duraklatılmış.
    preview.classList.add("is-paused");
    if (cursor) cursor.style.visibility = "hidden";

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      runLoopRef.current({
        preview,
        cursor,
        wait,
        moveCursor,
        press,
        isHovering,
        isCancelled: () => cancelled,
      });
    }

    return () => {
      cancelled = true;
      cursorToken += 1;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      pendingWaits.clear();
      if (tickHandle !== null) cancelAnimationFrame(tickHandle);
      if (rafId) cancelAnimationFrame(rafId);
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseWhenNotHovered]);

  return cardRef;
}

/** Kaynaktaki `<svg class="*-builder-cursor">` işaretlemesinin tek karşılığı. */
export function AnimationCursor({ className, gradientId, stops }) {
  return (
    <svg className={className} data-animation-cursor viewBox="0 0 32 42" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="5" y1="4" x2="26" y2="37" gradientUnits="userSpaceOnUse">
          {stops.map((stop) => (
            <stop key={stop.offset ?? "0"} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <path d="M4 3.5 27.5 25l-10.2 1.2 5.8 10.2-5.3 3-5.8-10.2-6.3 7.3Z" />
    </svg>
  );
}
