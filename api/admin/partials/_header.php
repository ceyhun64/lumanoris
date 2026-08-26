<!DOCTYPE html>
<html>

<head>
    <!-- Every admin AJAX endpoint now verifies a CSRF token (ajax/_guard.php).
         The panel's pages call those endpoints with hand-built FormData in a
         dozen places, so rather than editing each call site, attach the token
         to every same-origin request here. Endpoints also accept a csrf_token
         form field, which the older inline forms already send. -->
    <script>
      (function () {
        var CSRF_TOKEN = "<?= $_SESSION['csrf_token'] ?? '' ?>";
        var nativeFetch = window.fetch;
        window.fetch = function (input, init) {
          init = init || {};
          var url = typeof input === "string" ? input : (input && input.url) || "";
          var isSameOrigin = !/^https?:\/\//i.test(url) ||
            url.indexOf(window.location.origin) === 0;
          var method = (init.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
          if (isSameOrigin && method !== "GET" && CSRF_TOKEN) {
            var headers = new Headers(init.headers || (typeof input === "object" ? input.headers : undefined));
            if (!headers.has("X-CSRF-Token")) headers.set("X-CSRF-Token", CSRF_TOKEN);
            init.headers = headers;
          }
          return nativeFetch.call(this, input, init);
        };

        // XMLHttpRequest is still used by a few older admin widgets.
        var nativeOpen = XMLHttpRequest.prototype.open;
        var nativeSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url) {
          this.__csrfNeeded = String(method || "GET").toUpperCase() !== "GET";
          return nativeOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function () {
          if (this.__csrfNeeded && CSRF_TOKEN) {
            try { this.setRequestHeader("X-CSRF-Token", CSRF_TOKEN); } catch (e) {}
          }
          return nativeSend.apply(this, arguments);
        };
      })();
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bcryptjs/2.4.3/bcrypt.min.js"></script>
    <script src="/admin/assets/js/admin.js"></script>
    <link rel="stylesheet" href="/admin/assets/css/admin.css">
    <link rel="stylesheet" href="/admin/assets/css/notification.css">
    <link rel="stylesheet" href="/admin/assets/css/notifs.css">
    <script src="/admin/assets/js/Notification.js"></script>
    <title>Admin Paneli</title>
    <style>

    </style>
</head>

<body class="bg-gradient-to-br from-white to-gray-50">
    <header class="w-full bg-gray-800 shadow-sm px-4 py-2 flex items-center justify-between print:hidden relative lg:mb-0">

      <!-- Mobil Menü Toggle -->
      <button id="sidebarToggle" class="absolute left-4 top-1/2 -translate-y-1/2 lg:hidden focus:outline-none z-50">
        <i id="hamburger" class="bi bi-list text-2xl"></i>
      </button>

      <!-- Orta boşluk veya arama -->
      <div class="flex-1 flex justify-center">
        <!-- Arama çubuğu, bildirimler vb. -->
      </div>

      <!-- Çıkış Butonu -->
      <a href="/admin/" id="logout"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-100 rounded-md transition">
        <i class="bi bi-x-circle-fill"></i> Çıkış Yap
      </a>

    </header>
<script>
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout");

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const confirmed = confirm("Oturumu kapatmak istediğinizden emin misiniz?");
    if (!confirmed) return;

    try {
      const response = await fetch("/admin/ajax/cikis.php", {
        method: "POST",
        credentials: "same-origin"
      });

      const data = await response.json();

      new Notification({
        text: data.message || "Çıkış işlemi tamamlandı.",
        position: "top-right",
        type: data.status === "success" ? "success" : "error",
        pauseOnHover: false,
        canClose: false,
        autoClose: 3000,
        showProgress: true
      });

      if (data.status === "success" && data.redirect) {
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 3000);
      }

    } catch (error) {
      new Notification({
        text: "Bir hata oluştu: " + error.message,
        position: "top-right",
        type: "error",
        pauseOnHover: false,
        canClose: false,
        autoClose: 3000,
        showProgress: true
      });
    }
  });
});
</script>
