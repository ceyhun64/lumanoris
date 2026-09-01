"use client";

import { AnimationCursor, useHoverAnimation } from "./useHoverAnimation";

/** Kart 2 hue'su: violet-300 → violet-400 → violet-600. */
const CURSOR_STOPS = [
  { offset: undefined, color: "#c4b5fd" },
  { offset: "0.5", color: "#a78bfa" },
  { offset: "1", color: "#7c3aed" },
];

const MODEL_TILES = [
  { label: "Yaratıcı", tone: "mint" },
  { label: "Uzman", tone: "cyan", selected: true },
  { label: "Analist", tone: "blue" },
];

const PLANS = ["1 Haftalık", "2 Haftalık", "3 Haftalık", "1 Aylık"];

const TILE_ICON = {
  mint: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8M18.4 5.6l-2.8 2.8m-7.2 7.2-2.8 2.8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  cyan: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v14H4zM8 9h8M8 13h5" />
    </svg>
  ),
  blue: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h14v14H5zM8 9h8M8 13h6M8 17h3" />
    </svg>
  ),
};

export default function MarketPreview() {
  const cardRef = useHoverAnimation(async ({ preview, wait, moveCursor, isHovering, isCancelled }) => {
    const q = (sel) => preview.querySelector(sel);
    const stages = [...preview.querySelectorAll("[data-market-stage]")];
    const label = q("[data-market-label]");
    const buyButton = q("[data-market-buy]");
    const planButtons = [...preview.querySelectorAll(".market-plan-option")];
    const selectedPlan =
      planButtons.find((button) => button.textContent.includes("2 Haftalık")) || planButtons[1] || planButtons[0];
    if (!buyButton || !selectedPlan) return;

    const showStage = (name, number) => {
      stages.forEach((stage) => stage.classList.toggle("is-active", stage.dataset.marketStage === name));
      if (label) label.textContent = `${String(number).padStart(2, "0")} / 06`;
      if (!isHovering()) return;
      const target =
        name === "plans"
          ? selectedPlan
          : q(
              "[data-market-stage].is-active [data-market-buy], [data-market-stage].is-active .market-model-tile--selected, [data-market-stage].is-active .market-selected-plan, [data-market-stage].is-active .market-success-card, [data-market-stage].is-active .market-wait-copy",
            );
      moveCursor(target);
    };

    const clearPlans = () => planButtons.forEach((button) => button.classList.remove("is-selected"));

    while (!isCancelled()) {
      showStage("buy", 1);
      buyButton.classList.remove("is-pressed");
      clearPlans();
      await wait(1100);
      buyButton.classList.add("is-pressed");
      await wait(160);
      buyButton.classList.remove("is-pressed");
      await wait(550);

      showStage("plans", 2);
      clearPlans();
      selectedPlan.classList.add("is-selected");
      await wait(1150);
      selectedPlan.classList.add("is-pressed");
      await wait(160);
      selectedPlan.classList.remove("is-pressed");
      await wait(350);

      showStage("selected", 3);
      await wait(750);
      showStage("buyer", 4);
      await wait(1800);
      showStage("producer", 5);
      await wait(2600);
      showStage("wait", 6);
      await wait(2200);
    }
  });

  return (
    <div
      ref={cardRef}
      className="feature-animation-card feature-card-grid bg-gradient-card ring-fuchsia-400/10 ring-1 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden feature-accent feature-accent--market"
      data-hover-animation
    >
      <div className="relative">
        <h3 className="text-xl font-display font-semibold text-white mb-4">Açık Pazar Modeli</h3>
        <p className="text-white/75 leading-relaxed mb-6">
          Üreticiler modellerini sergileyip gelir edebilir, kullanıcılar ise farklı seçenekleri inceleyerek
          ihtiyaçlarına en uygun yapay zeka çözümüne kolayca ulaşabilir.
        </p>
      </div>

      <div className="relative">
        <div className="market-builder-preview" data-market-builder data-animation-preview>
          <div className="market-builder-grid" aria-hidden="true" />
          <div className="market-builder-topbar">
            <span>
              <i /> AÇIK PAZAR
            </span>
            <b data-market-label>01 / 06</b>
          </div>

          <div className="market-stage is-active" data-market-stage="buy">
            <span className="market-kicker">MODEL MAĞAZASI</span>
            <strong className="market-title">Size uygun modeli keşfedin</strong>
            <div className="market-model-grid">
              {MODEL_TILES.map((tile) => (
                <div
                  key={tile.label}
                  className={`market-model-tile${tile.selected ? " market-model-tile--selected" : ""}`}
                >
                  <i className={`market-model-icon market-model-icon--${tile.tone}`}>{TILE_ICON[tile.tone]}</i>
                  <span>{tile.label}</span>
                  {tile.selected && (
                    <button className="market-buy-button" type="button" data-market-buy tabIndex={-1}>
                      <span>Satın Al</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 8h12l1 12H5Z" />
                        <path d="M9 8a3 3 0 0 1 6 0" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="market-stage" data-market-stage="plans">
            <span className="market-kicker">PLAN SEÇİMİ</span>
            <strong className="market-title">Erişim süresini seçin</strong>
            <div className="market-plan-grid">
              {PLANS.map((plan) => (
                <button key={plan} type="button" className="market-plan-option" tabIndex={-1}>
                  {plan}
                </button>
              ))}
            </div>
          </div>

          <div className="market-stage" data-market-stage="selected">
            <span className="market-kicker">SEÇİM YAPMA</span>
            <strong className="market-title">Planınızı onaylayın</strong>
            <div className="market-selected-plan">
              <span>2 Haftalık</span>
              <i>Seçildi</i>
            </div>
          </div>

          <div className="market-stage" data-market-stage="buyer">
            <div className="market-success-card">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
              <strong>Ödeme İşlemi Onaylandı!</strong>
              <span>Modele Erişim Sağlandı.</span>
            </div>
          </div>

          <div className="market-stage" data-market-stage="producer">
            <div className="market-success-card">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
              <strong>Erişim hazır</strong>
              <span>Model kullanılabilir durumda.</span>
            </div>
            <div className="market-earnings-toast">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8M9.5 10.2c0-1.2 5-1.2 5 0s-5 1.2-5 2.4 5 1.2 5 0M10 6.5h4M10 17.5h4" />
              </svg>
              <span>Tebrikler! Modeliniz Satıldı &amp; Gelir Hesabınıza Tanımlandı.</span>
            </div>
          </div>

          <div className="market-stage market-stage--wait" data-market-stage="wait">
            <div className="market-wait-content">
              <div className="market-wait-orb">
                <i />
              </div>
              <div className="market-wait-copy">
                <strong>İşlem Tamamlandı</strong>
                <span>Yeni keşifler için pazara dönülüyor...</span>
              </div>
            </div>
          </div>

          <AnimationCursor
            className="market-builder-cursor"
            gradientId="marketCursorGradient"
            stops={CURSOR_STOPS}
          />
        </div>
      </div>
    </div>
  );
}
