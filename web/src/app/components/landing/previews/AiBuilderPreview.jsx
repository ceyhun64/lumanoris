"use client";

import { AnimationCursor, useHoverAnimation } from "./useHoverAnimation";

/** Cursor gradient'i: fuchsia-200 → fuchsia-400 → violet-400 (kart 1 hue'su). */
const CURSOR_STOPS = [
  { offset: undefined, color: "#f5d0fe" },
  { offset: "0.5", color: "#e879f9" },
  { offset: "1", color: "#a78bfa" },
];

export default function AiBuilderPreview() {
  const cardRef = useHoverAnimation(async ({ preview, wait, moveCursor, isHovering, isCancelled }) => {
    const q = (sel) => preview.querySelector(sel);
    const stages = [...preview.querySelectorAll("[data-builder-stage]")];
    const stageLabel = q("[data-builder-stage-label]");
    const createButton = q("[data-builder-create]");
    const nameField = q("[data-builder-name]");
    const avatar = q("[data-builder-avatar]");
    const documentButton = q("[data-builder-document]");
    const uploadProgress = q(".ai-builder-upload-progress");
    const uploadRing = q("[data-builder-ring]");
    const uploadStatus = q("[data-builder-upload-status]");
    const publishButton = q("[data-builder-publish]");
    const liveStatus = q(".ai-builder-live-status");
    if (!createButton || !nameField || !publishButton) return;

    const showStage = (name, number) => {
      stages.forEach((stage) => stage.classList.toggle("is-active", stage.dataset.builderStage === name));
      if (stageLabel) stageLabel.textContent = `${String(number).padStart(2, "0")} / 05`;
      if (isHovering()) {
        moveCursor(q("[data-builder-stage].is-active button, [data-builder-stage].is-active input"));
      }
    };

    const reset = () => {
      showStage("create", 1);
      createButton.classList.remove("is-pressed");
      documentButton?.classList.remove("is-pressed");
      publishButton.classList.remove("is-pressed");
      publishButton.style.visibility = "hidden";
      publishButton.style.opacity = "0";
      publishButton.style.pointerEvents = "none";
      if (liveStatus) {
        liveStatus.classList.remove("is-visible");
        liveStatus.style.display = "none";
      }
      nameField.value = "";
      avatar?.classList.remove("is-selected");
      uploadProgress?.classList.remove("is-visible");
      if (uploadRing) uploadRing.style.strokeDashoffset = "100.5";
      if (uploadStatus) uploadStatus.textContent = "Hazırlanıyor...";
    };

    /* Kaynakta bu döngü kendini `runBuilderLoop()` ile yeniden çağırıyordu;
       burada `while` + iptal kontrolü — yığın büyümüyor ve unmount'ta duruyor. */
    while (!isCancelled()) {
      reset();
      await wait(1450);
      createButton.classList.add("is-pressed");
      await wait(140);
      createButton.classList.remove("is-pressed");
      await wait(650);

      showStage("name", 2);
      await wait(1000);
      for (const character of "lumanoris") {
        nameField.value += character;
        nameField.setSelectionRange(nameField.value.length, nameField.value.length);
        await wait(120);
      }
      await wait(650);

      showStage("profile", 3);
      await wait(700);
      avatar?.classList.add("is-selected");
      await wait(1000);

      showStage("document", 4);
      await wait(650);
      documentButton?.classList.add("is-pressed");
      uploadProgress?.classList.add("is-visible");
      if (uploadStatus) uploadStatus.textContent = "Yükleniyor...";
      await wait(140);
      documentButton?.classList.remove("is-pressed");
      for (let value = 10; value <= 100; value += 10) {
        if (uploadRing) uploadRing.style.strokeDashoffset = `${100.5 - (100.5 * value) / 100}`;
        if (uploadStatus) uploadStatus.textContent = value === 100 ? "Belge hazır" : `Yükleniyor... ${value}%`;
        await wait(70);
      }
      await wait(650);

      if (uploadStatus) uploadStatus.textContent = "Model eğitiliyor... 80%";
      if (uploadRing) uploadRing.style.strokeDashoffset = "20.1";
      for (let value = 80; value <= 100; value += 10) {
        if (uploadRing) uploadRing.style.strokeDashoffset = `${100.5 - (100.5 * value) / 100}`;
        if (uploadStatus) {
          uploadStatus.textContent = value === 100 ? "Eğitim Tamamlandı" : `Model eğitiliyor... ${value}%`;
        }
        await wait(140);
      }
      await wait(500);

      uploadProgress?.classList.remove("is-visible");
      publishButton.style.visibility = "visible";
      publishButton.style.opacity = "1";
      publishButton.style.pointerEvents = "auto";
      showStage("publish", 5);
      await wait(700);
      await moveCursor(publishButton);
      publishButton.classList.add("is-pressed");
      await wait(140);
      publishButton.classList.remove("is-pressed");
      await wait(600);
    }
  });

  return (
    <div
      ref={cardRef}
      className="feature-animation-card feature-card-grid bg-gradient-card ring-fuchsia-400/10 ring-1 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden feature-accent feature-accent--ai"
      data-hover-animation
    >
      <div className="relative">
        <h3 className="text-xl font-display font-semibold text-white mb-4">Özelleştirilebilir Yapay Zeka</h3>
        <p className="text-white/75 leading-relaxed mb-6">
          Bireyler ve işletmeler kolayca yapay zeka modelleri geliştirebilir. Kullanıcılar oluşturdukları
          modelleri yayınlayarak geniş kitlelere ulaşabilir.
        </p>
      </div>

      <div className="relative">
        <div className="ai-builder-preview" data-ai-builder data-animation-preview>
          <div className="ai-builder-grid" aria-hidden="true" />
          <div className="ai-builder-topbar">
            <div className="ai-builder-brand">
              <span className="ai-builder-status-dot" />
              <span>MODEL OLUŞTURUCU</span>
            </div>
            <span className="ai-builder-stage-label" data-builder-stage-label>
              01 / 05
            </span>
          </div>

          <div className="ai-builder-stage ai-builder-stage--create is-active" data-builder-stage="create">
            <div className="ai-builder-stage-heading">
              <span className="ai-builder-kicker">01 / OLUŞTUR</span>
              <span className="ai-builder-stage-title">Yeni modelinizi başlatın</span>
            </div>
            <button className="ai-builder-create-button" type="button" data-builder-create tabIndex={-1}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Model Oluştur</span>
            </button>
          </div>

          <div className="ai-builder-stage ai-builder-stage--name" data-builder-stage="name">
            <div className="ai-builder-stage-heading">
              <span className="ai-builder-kicker">02 / İSİMLENDİRME</span>
              <span className="ai-builder-stage-title">Modelinize bir isim verin</span>
            </div>
            <div className="ai-builder-name-field">
              <label htmlFor="builderName">Model adı</label>
              <div>
                <input
                  id="builderName"
                  data-builder-name
                  type="text"
                  defaultValue=""
                  readOnly
                  tabIndex={-1}
                  aria-label="Model adı"
                />
                <i className="ai-builder-caret" />
              </div>
            </div>
          </div>

          <div className="ai-builder-stage ai-builder-stage--profile" data-builder-stage="profile">
            <div className="ai-builder-stage-heading">
              <span className="ai-builder-kicker">03 / PROFİL SEÇİMİ</span>
              <span className="ai-builder-stage-title">Modelinizin profilini seçin</span>
            </div>
            <div className="ai-builder-avatar-panel">
              <span className="ai-builder-avatar-label">Profil simgesi</span>
              <div className="ai-builder-avatars">
                <button
                  type="button"
                  aria-label="Lumanoris profilini seç"
                  data-builder-avatar
                  className="is-selected"
                  tabIndex={-1}
                >
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M24 5 39 14v20L24 43 9 34V14Z" />
                    <path d="m16 28 8-13 8 13-8-4Z" />
                  </svg>
                </button>
                <button type="button" aria-label="Alternatif profil seç" tabIndex={-1}>
                  <span />
                </button>
                <button type="button" aria-label="Yardımcı profil seç" tabIndex={-1}>
                  <span />
                </button>
              </div>
            </div>
          </div>

          <div className="ai-builder-stage ai-builder-stage--document" data-builder-stage="document">
            <div className="ai-builder-stage-heading">
              <span className="ai-builder-kicker">04 / BELGE YÜKLEME</span>
              <span className="ai-builder-stage-title">Bilgi kaynağınızı ekleyin</span>
            </div>
            <button className="ai-builder-document-button" type="button" data-builder-document tabIndex={-1}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V4m0 0L7 9m5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
              </svg>
              <span>Belge Yükle</span>
            </button>
            <div className="ai-builder-upload-progress">
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="16" />
                <circle data-builder-ring cx="20" cy="20" r="16" />
              </svg>
              <span data-builder-upload-status>Hazırlanıyor...</span>
            </div>
          </div>

          <div className="ai-builder-stage ai-builder-stage--publish" data-builder-stage="publish">
            <div className="ai-builder-stage-heading">
              <span className="ai-builder-kicker">05 / YAYINLA</span>
              <span className="ai-builder-stage-title">Modeliniz hazır</span>
            </div>
            <button className="ai-builder-publish-button" type="button" data-builder-publish tabIndex={-1}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
              <span>Yayınla</span>
            </button>
            <div className="ai-builder-live-status">
              <div className="ai-builder-live-orb">
                <i />
              </div>
              <strong>Model Eğitiliyor &amp; Canlıda...</strong>
            </div>
          </div>

          <AnimationCursor
            className="ai-builder-cursor"
            gradientId="builderCursorGradient"
            stops={CURSOR_STOPS}
          />
        </div>
      </div>
    </div>
  );
}
