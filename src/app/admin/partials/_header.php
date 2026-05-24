<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bcryptjs/2.4.3/bcrypt.min.js"></script>
    <script src="/lumanoris/admin/assets/js/admin.js"></script>
    <link rel="stylesheet" href="/lumanoris/admin/assets/css/admin.css">
    <link rel="stylesheet" href="/lumanoris/admin/assets/css/notification.css">
    <link rel="stylesheet" href="/lumanoris/admin/assets/css/notifs.css">
    <script src="/lumanoris/admin/assets/js/Notification.js"></script>
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