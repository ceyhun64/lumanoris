/**
 * Call at the top of any action handler that requires a logged-in user
 * (like, dislike, comment, follow, add-to-cart, buy, "not interested", "hide
 * this bot", ...). Guest browsing itself stays open everywhere — pages
 * intentionally skip the sessioncheck.php redirect-to-login on load (see the
 * "Giriş kontrolü geçici olarak devre dışı" comments throughout) so a
 * visitor can look around without an account. This only gates the action
 * itself once they try to do something that needs one.
 *
 * Returns true and does nothing if already logged in; otherwise redirects to
 * /login and returns false, so callers write:
 *   if (!requireLogin(userId, router)) return;
 */
export function requireLogin(userId, router) {
    if (userId) return true;
    router.push('/login');
    return false;
}
