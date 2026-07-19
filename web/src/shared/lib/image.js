import avatarFallback from "@/images/avatar-bot.jpg";
import coverFallback from "@/images/bot-image.png";

/**
 * next/image's <Image> throws a hard render error when `src` is
 * null/undefined/"" (not just a broken-image icon like a plain <img> would
 * show) — so any chatbot row missing a profil_fotografi/kapak_fotografi
 * crashes the whole page wherever this wasn't guarded. Normal bots can't
 * end up without both images (ChatbotForm requires them before submit), but
 * a bot inserted outside that form — e.g. a system/platform bot seeded
 * directly into the database — can. Route every chatbot avatar/cover
 * through one of these instead of a one-off `||`/`&&` at each call site, so
 * the guard can't be forgotten the next time a card/list/modal needs one.
 */
export function resolveAvatarSrc(value) {
    return value || avatarFallback;
}

export function resolveCoverSrc(value) {
    return value || coverFallback;
}
