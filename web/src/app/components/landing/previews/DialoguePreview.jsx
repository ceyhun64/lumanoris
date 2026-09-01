"use client";

import { AnimationCursor, useHoverAnimation } from "./useHoverAnimation";

/** Kart 4 hue'su: fuchsia-200 → violet-400 → violet-600 (accent-purple). */
const CURSOR_STOPS = [
  { offset: undefined, color: "#f5d0fe" },
  { offset: "0.5", color: "#a78bfa" },
  { offset: "1", color: "#7c3aed" },
];

const LIBRARY = [
  { icon: "✦", title: "Merhaba", meta: "Yeni sohbet" },
  { icon: "◌", title: "Fikir Atölyesi", meta: "12 mesaj" },
  { icon: "↗", title: "Üretkenlik", meta: "Herkese açık" },
];

export default function DialoguePreview() {
  const cardRef = useHoverAnimation(async ({ preview, wait, moveCursor, isCancelled }) => {
    const q = (sel) => preview.querySelector(sel);
    const stages = [...preview.querySelectorAll("[data-dialogue-stage]")];
    const stepLabel = q("[data-dialogue-step]");
    const addButton = q("[data-dialogue-add]");
    const titleInput = q("[data-dialogue-input]");
    const saveButton = q("[data-dialogue-save]");
    const firstLibraryItem = q(".dialogue-library-grid > article");
    if (!addButton || !titleInput || !saveButton) return;

    const showStage = (name, step) => {
      stages.forEach((stage) => stage.classList.toggle("is-active", stage.dataset.dialogueStage === name));
      if (stepLabel) stepLabel.textContent = `${String(step).padStart(2, "0")} / 03`;
    };

    const moveTo = async (target) => {
      if (!target) return;
      await moveCursor(target);
      await wait(180);
    };

    while (!isCancelled()) {
      showStage("chat", 1);
      addButton.classList.remove("is-pressed");
      saveButton.classList.remove("is-pressed");
      titleInput.value = "";
      await wait(850);

      await moveTo(addButton);
      addButton.classList.add("is-pressed");
      await wait(140);
      addButton.classList.remove("is-pressed");

      showStage("save", 2);
      await wait(280);
      await moveTo(titleInput);
      for (const character of "Merhaba") {
        titleInput.value += character;
        await wait(105);
      }
      await moveTo(saveButton);
      saveButton.classList.add("is-pressed");
      await wait(150);
      saveButton.classList.remove("is-pressed");

      showStage("library", 3);
      await wait(320);
      await moveTo(firstLibraryItem);
      await wait(2200);
    }
  });

  return (
    <div
      ref={cardRef}
      className="feature-animation-card feature-card-grid hover:ring-fuchsia-400/20 transition-all duration-300 bg-gradient-card ring-fuchsia-400/10 ring-1 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden feature-accent feature-accent--dialogue"
      data-hover-animation
    >
      <div className="relative">
        <h3 className="text-xl font-display font-semibold text-white mb-4">Diyalog Defteri</h3>
        <p className="text-white/75 leading-relaxed mb-6">
          Diyalog Defteri, kullanıcıların chatbotlarla gerçekleştirdikleri sohbetleri kaydedip paylaşarak
          bir kütüphane oluşturduğu yenilikçi bir özelliktir.
        </p>
      </div>

      <div className="relative">
        <div className="dialogue-builder-preview" data-dialogue-builder data-animation-preview>
          <div className="dialogue-builder-topbar">
            <span>
              <i /> DİYALOG DEFTERİ
            </span>
            <b data-dialogue-step>01 / 03</b>
          </div>

          <div className="dialogue-stage dialogue-stage--chat is-active" data-dialogue-stage="chat">
            <div className="dialogue-bubble">
              <span className="dialogue-bot-icon">✦</span>
              <p>Merhaba, size nasıl yardımcı olabilirim?</p>
            </div>
            <button className="dialogue-save-button" type="button" data-dialogue-add tabIndex={-1}>
              Diyalog Defterine Ekle
            </button>
          </div>

          <div className="dialogue-stage dialogue-stage--save" data-dialogue-stage="save">
            <div className="dialogue-modal-backdrop" aria-hidden="true" />
            <div className="dialogue-save-modal" role="dialog" aria-label="Diyaloğu kaydet">
              <span className="dialogue-kicker">DİYALOĞU KAYDET</span>
              <label htmlFor="dialogueTitle">Diyalog Başlığı</label>
              <input id="dialogueTitle" type="text" data-dialogue-input defaultValue="" readOnly tabIndex={-1} />
              <button type="button" data-dialogue-save tabIndex={-1}>
                Kaydet
              </button>
            </div>
          </div>

          <div className="dialogue-stage dialogue-stage--library" data-dialogue-stage="library">
            <span className="dialogue-kicker">YAYINLANAN DİYALOGLAR</span>
            <strong className="dialogue-library-title">Diyalog kütüphaneniz</strong>
            <div className="dialogue-library-grid">
              {LIBRARY.map((item) => (
                <article key={item.title}>
                  <i>{item.icon}</i>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </article>
              ))}
            </div>
          </div>

          <AnimationCursor
            className="dialogue-builder-cursor"
            gradientId="dialogueCursorGradient"
            stops={CURSOR_STOPS}
          />
        </div>
      </div>
    </div>
  );
}
