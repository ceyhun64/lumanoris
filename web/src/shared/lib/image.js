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
/**
 * Her iki yardimci da DAIMA string dondurur.
 *
 * Eskiden yedek deger olarak static import nesnesinin kendisi donuyordu
 * ({src, width, height, blurDataURL}). Bu yalnizca <Image> ile calisiyor;
 * duz bir <img src={...}> ile React nesneyi stringe cevirip
 * src="[object Object]" yaziyor ve gorsel kirik cikiyor — checkout/sepet
 * sayfasinda tam olarak bu oluyordu. Cagri yerlerinin bir kismi bunu
 * ".src" ekleyerek telafi etmisti, yani tuzaga birden fazla kez dusulmus.
 *
 * <Image> string src'yi zaten kabul ediyor (fill ya da acik width/height
 * ile kullaniliyorlar), bu yuzden tek tip string donmek iki tarafi da
 * memnun ediyor.
 */
export function resolveAvatarSrc(value) {
    return value || avatarFallback.src;
}

export function resolveCoverSrc(value) {
    return value || coverFallback.src;
}
