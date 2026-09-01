"use client";

import { AnimationCursor, useHoverAnimation } from "./useHoverAnimation";

/** Kart 6 hue'su: emerald-200 → emerald-400 → success (#10B981). */
const CURSOR_STOPS = [
  { offset: undefined, color: "#a7f3d0" },
  { offset: "0.5", color: "#34d399" },
  { offset: "1", color: "#10b981" },
];

const NAV_ITEMS = ["Genel Bakış", "Ödemeler", "Bakiyem", "İşlem Geçmişi"];

/** Modal üç aşamada da aynı; fark yalnızca durum sınıflarında. */
function WithdrawalModal({ stateClass = "", checked = false, pressed = false }) {
  return (
    <>
      <div className="luma-withdrawal-overlay" />
      <div className={`luma-withdrawal-modal${stateClass}`} aria-live="polite">
        <label className="luma-amount-field">
          <span className="luma-field-label">Çekmek İstediğiniz Tutar</span>
          <input type="text" defaultValue="1.000 ₺" readOnly tabIndex={-1} aria-label="Çekmek istediğiniz tutar" />
        </label>
        <label className={`luma-full-amount${checked ? " is-checked" : ""}`} data-luma-checkbox-label>
          <input type="checkbox" defaultChecked={checked} data-luma-checkbox aria-label="Tümünü çek" tabIndex={-1} />
          <span className="luma-checkbox-box" aria-hidden="true" />
          <span>Tümünü Çek</span>
        </label>
        <button
          type="button"
          className={`luma-submit-button${pressed ? " is-pressed" : ""}`}
          data-luma-submit
          tabIndex={-1}
        >
          Talep Oluştur
        </button>
      </div>
    </>
  );
}

export default function WalletPreview() {
  const cardRef = useHoverAnimation(async ({ preview, wait, moveCursor, press, isHovering, isCancelled }) => {
    const q = (sel) => preview.querySelector(sel);
    const stages = [...preview.querySelectorAll("[data-animation-stage]")];
    const stepLabel = q("[data-luma-step]");
    const balanceButton = q("[data-luma-balance-action]");
    const submitButton = q("[data-animation-stage='luma-modal'] [data-luma-submit]");
    const checkbox = q("[data-animation-stage='luma-modal'] [data-luma-checkbox]");
    const checkboxLabel = q("[data-animation-stage='luma-modal'] [data-luma-checkbox-label]");
    if (!balanceButton) return;

    const showStage = (name, step) => {
      stages.forEach((stage) => stage.classList.toggle("is-active", stage.dataset.animationStage === name));
      if (stepLabel) stepLabel.textContent = `${String(step).padStart(2, "0")} / 03`;
      if (!isHovering()) return;
      if (name === "luma-balance") moveCursor(balanceButton);
      else if (name === "luma-modal") moveCursor(checkboxLabel);
    };

    const toggleCheckbox = (next) => {
      if (!checkbox || !checkboxLabel) return;
      checkbox.checked = next;
      checkboxLabel.classList.toggle("is-checked", next);
    };

    while (!isCancelled()) {
      toggleCheckbox(false);
      showStage("luma-balance", 1);
      await wait(850);
      await moveCursor(balanceButton);
      press(balanceButton);
      await wait(260);

      showStage("luma-modal", 2);
      await wait(560);
      await moveCursor(checkboxLabel);
      toggleCheckbox(true);
      press(checkboxLabel);
      await moveCursor(submitButton);
      press(submitButton);
      await wait(240);

      showStage("luma-success", 3);
      await wait(2600);
    }
  });

  return (
    <div
      ref={cardRef}
      className="feature-animation-card feature-card-grid hover:ring-fuchsia-400/20 transition-all duration-300 bg-gradient-card ring-fuchsia-400/10 ring-1 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden feature-accent feature-accent--wallet"
      data-hover-animation
    >
      <div className="relative">
        <h3 className="text-xl font-display font-semibold text-white mb-4">Bakiyeni Çek</h3>
        <p className="text-white/75 leading-relaxed mb-6">
          Kazancınızı Bakiyem sayfasından anlık olarak izleyin; çekmek istediğiniz tutarı belirleyip tek
          tıkla hesabınıza aktarın.
        </p>
      </div>

      <div className="relative">
        <div className="luma-coin-preview" data-luma-builder data-animation-preview>
          <div className="luma-coin-grid" aria-hidden="true" />
          <div className="luma-coin-topbar">
            <span>
              <i /> BAKİYE YÖNETİMİ
            </span>
            <b data-luma-step>01 / 03</b>
          </div>

          <div className="luma-coin-stage" data-animation-stage="luma-dashboard">
            <div className="luma-dashboard-shell" aria-label="Bakiyem menüsü">
              <aside className="luma-sidebar" aria-label="Sidebar">
                <span className="luma-sidebar-brand">Luma</span>
                <nav className="luma-sidebar-nav" aria-label="Yönetim menüsü">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`luma-nav-item${item === "Bakiyem" ? " is-active" : ""}`}
                      data-luma-nav
                      tabIndex={-1}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </aside>
              <div className="luma-panel">
                <span className="luma-panel-label">
                  <i /> Bakiyem
                </span>
                <div className="luma-dashboard-balance">
                  1.000 <span>₺</span>
                </div>
              </div>
            </div>
          </div>

          <div className="luma-coin-stage is-active" data-animation-stage="luma-balance">
            <div className="luma-balance-panel">
              <div className="luma-balance-amount">
                1.000 <span>₺</span>
              </div>
              <button type="button" className="luma-withdrawal-button" data-luma-balance-action tabIndex={-1}>
                Hesabınıza Aktarın
              </button>
            </div>
          </div>

          <div className="luma-coin-stage" data-animation-stage="luma-button-click">
            <div className="luma-balance-panel">
              <div className="luma-balance-amount">
                1.000 <span>₺</span>
              </div>
              <button
                type="button"
                className="luma-withdrawal-button luma-withdrawal-button--active"
                tabIndex={-1}
              >
                Hesabınıza Aktarın
              </button>
            </div>
          </div>

          <div className="luma-coin-stage" data-animation-stage="luma-modal">
            <WithdrawalModal />
          </div>

          <div className="luma-coin-stage" data-animation-stage="luma-checkbox">
            <WithdrawalModal stateClass=" is-checked" checked />
          </div>

          <div className="luma-coin-stage" data-animation-stage="luma-submit">
            <WithdrawalModal stateClass=" is-submitting" checked pressed />
          </div>

          <div className="luma-coin-stage" data-animation-stage="luma-success">
            <div className="luma-success-state">
              <div className="luma-success-header">
                <span className="luma-check-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.5 9.8 17 19 7.5" />
                  </svg>
                </span>
                <strong>Tebrikler!</strong>
              </div>
              <p>
                Bakiyenizi çekmek için talebiniz alındı. İşleminiz 1-7 iş günü içerisinde
                tamamlanacaktır.
              </p>
            </div>
          </div>

          <AnimationCursor
            className="luma-coin-cursor"
            gradientId="lumaCursorGradient"
            stops={CURSOR_STOPS}
          />
        </div>
      </div>
    </div>
  );
}
