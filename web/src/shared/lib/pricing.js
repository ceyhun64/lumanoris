// Single source of truth for the marketplace pricing/earnings math that used
// to be copy-pasted (with a comment claiming it "must match the PHP side")
// into ChatbotForm.jsx, PublishModal.jsx, AddToSaleListModal.jsx and
// BuyModal.jsx independently. Every value here mirrors a constant in
// api/src/Shared/Constants/AppConfig.php — if one side changes, the other
// must be updated too, but now there is exactly one frontend place to do it.

// AppConfig::DISCOUNT_MONTHLY_FACTOR — monthly price is 4 weeks' worth at a
// 10% discount.
export const MONTHLY_DISCOUNT_FACTOR = 0.9;

// AppConfig::SELLER_COMMISSION_WEEKLY / SELLER_COMMISSION_MONTHLY — the cut
// a seller keeps of a weekly/monthly sale.
export const SELLER_COMMISSION_WEEKLY = 0.85;
export const SELLER_COMMISSION_MONTHLY = 0.80;

// AppConfig::MIN_WEEKLY_PRICE / MAX_WEEKLY_PRICE — enforced server-side in
// ChatbotController::assertValidPrice (publishChatbot / updateChatbotPrice).
// Kept here too so the price popups can show the range as an inline note
// and reject an out-of-range value before it ever reaches the server.
export const MIN_WEEKLY_PRICE = 1;
export const MAX_WEEKLY_PRICE = 5000;

// Sohbet Luma Coini: per-bot bonus message allowance unlocked by a purchase,
// tiered by how much was actually paid. Mirrors coin_engine.php's
// calculateMessageAllowance().
const COIN_TIER_BASE = 150;
const COIN_TIER_STEP = 100;
const COIN_TIER_CAP = 1000;

export function deriveMonthlyPrice(weeklyPrice) {
    const weekly = Number(weeklyPrice) || 0;
    return Math.round(weekly * 4 * MONTHLY_DISCOUNT_FACTOR);
}

export function calculateMessageAllowance(totalPaid) {
    if (!totalPaid || totalPaid < 100) return 0;
    const tier = Math.floor(totalPaid / 100);
    return Math.min(COIN_TIER_CAP, COIN_TIER_BASE + (tier - 1) * COIN_TIER_STEP);
}

/**
 * Returns a Turkish error message if `value` isn't a valid price for the
 * given bound, or null when it's fine. `max` lets callers pass a different
 * ceiling for weekly vs. monthly (monthly is naturally ~4x weekly).
 */
export function validatePrice(value, label, max = MAX_WEEKLY_PRICE) {
    const n = Number(value);
    if (isNaN(n) || n <= 0) {
        return `${label} fiyat geçerli pozitif bir sayı olmalıdır.`;
    }
    if (n > max) {
        return `${label} fiyat en fazla ${max.toLocaleString('tr-TR')}₺ olabilir.`;
    }
    return null;
}
