<?php
$adminler = $database->selectMulti("id, kullanici_adi FROM adminler");
?>
<main class="p-6 max-w-screen-xl mx-auto">
  <!-- Başlık -->
  <section class="text-center mb-8">
    <!-- Başlık stili güncellendi -->
    <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Yönetimi</h2>
    <p class="text-gray-500 mt-1">Mevcut admin hesaplarını düzenleyebilir veya yeni admin ekleyebilirsiniz.</p>
  </section>

  <!-- Grid: Liste + Form -->
  <div class="grid grid-cols-1 lg:grid-cols-[300px_auto] gap-6">
    
    <!-- Admin Listesi (Kart stili güncellendi: rounded-xl, shadow-lg, border) -->
    <aside class="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
      <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-3">Adminler</h3>
      <ul id="adminUl" class="space-y-2 max-h-[500px] overflow-auto">
        <!-- PHP ile döşenecek -->
        <?php foreach($adminler as $admin): ?>
          <!-- Liste öğesi stili güncellendi: flex, items-center, hover:bg-indigo-50/70, text-gray-800 -->
          <li class="flex items-center bg-gray-100 hover:bg-indigo-50/70 text-gray-800 px-3 py-2 rounded-lg cursor-pointer transition duration-150" data-id="<?= $admin['id'] ?>">
            <i class="bi bi-person-fill text-indigo-500 mr-2"></i>
            <span class="font-medium"><?= htmlspecialchars($admin['kullanici_adi']) ?></span>
          </li>
        <?php endforeach; ?>
      </ul>
    </aside>

    <!-- Admin Formu (Kart stili güncellendi: rounded-xl, shadow-lg, border) -->
    <section class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Admin Bilgileri</h3>
      <form id="adminForm" class="space-y-4">
        <input type="hidden" name="id" id="id" value="0">
        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">

        <div>
          <label for="kullanici_adi" class="block font-semibold text-sm text-gray-700 mb-1">Kullanıcı Adı</label>
          <!-- Input stili güncellendi: rounded-lg, py-2.5, focus:ring-indigo-500 -->
          <input type="text" id="kullanici_adi" name="kullanici_adi"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm">
        </div>

        <div>
          <label for="sifre" class="block font-semibold text-sm text-gray-700 mb-1">Yeni Şifre</label>
          <!-- Input stili güncellendi: rounded-lg, py-2.5, focus:ring-indigo-500 -->
          <input type="password" id="sifre" name="sifre"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm">
        </div>

        <div>
          <label for="sifre2" class="block font-semibold text-sm text-gray-700 mb-1">Şifreyi Onaylayın</label>
          <!-- Input stili güncellendi: rounded-lg, py-2.5, focus:ring-indigo-500 -->
          <input type="password" id="sifre2" name="sifre2"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm">
        </div>

        <div class="flex justify-between gap-2 pt-4">
          <!-- Buton stili güncellendi: flex-1, font-semibold, rounded-lg, ikincil renkler -->
          <button type="button" id="new"
                  class="flex-1 hidden bg-gray-200 text-indigo-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition duration-150">Yeni Ekle</button>
          
          <!-- Buton stili güncellendi: flex-1, font-semibold, rounded-lg, indigo renk, shadow -->
          <button type="submit" id="saveOrUpdate"
                  class="flex-1 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition duration-150 shadow-md shadow-indigo-500/30">Kaydet</button>
          
          <!-- Buton stili güncellendi: flex-1, font-semibold, rounded-lg, shadow -->
          <button type="button" id="delete"
                  class="flex-1 hidden bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 active:scale-95 transition duration-150 shadow-md shadow-red-500/30">Sil</button>
        </div>
      </form>
    </section>
  </div>
</main>
<script>
    document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminForm");
  const saveOrUpdateBtn = document.getElementById("saveOrUpdate");
  const newBtn = document.getElementById("new");
  const deleteBtn = document.getElementById("delete");
  const adminUl = document.getElementById("adminUl");

  // Admin seçimi → AJAX ile bilgileri getir
  adminUl.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", async () => {
      const id = li.dataset.id;

      const formData = new FormData();
      formData.append("action", "get");
      formData.append("id", id);

      try {
        const res = await fetch("/admin/ajax/adminler.php", {
          method: "POST",
          body: formData
        });
        const result = await res.json();

        if (result.status === "success") {
          form.id.value = result.data.id;
          form.kullanici_adi.value = result.data.kullanici_adi;
          form.sifre.value = "";
          form.sifre2.value = "";

          adminUl.querySelectorAll("li").forEach(item => {
            item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
            item.classList.add("bg-gray-100", "hover:bg-gray-200");
          });

          li.classList.remove("bg-gray-100", "hover:bg-gray-200");
          li.classList.add("bg-white", "text-black", "pointer-events-none", "shadow-inner");

          saveOrUpdateBtn.textContent = "Güncelle";
          newBtn.classList.remove("hidden");
          deleteBtn.classList.remove("hidden");
        } else {
          new Notification({ text: result.message, type: "error", position: "top-right" });
        }
      } catch (err) {
        new Notification({ text: "Admin bilgisi alınamadı: " + err.message, type: "error", position: "top-right" });
      }
    });
  });

  // Yeni admin formu
  newBtn.addEventListener("click", () => {
    form.reset();
    form.id.value = "0";
    saveOrUpdateBtn.textContent = "Kaydet";
    newBtn.classList.add("hidden");
    deleteBtn.classList.add("hidden");

    adminUl.querySelectorAll("li").forEach(item => {
      item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
      item.classList.add("bg-gray-100", "hover:bg-gray-200");
    });
  });

  // Kaydet / Güncelle
  form.addEventListener("submit", async e => {
  e.preventDefault();

  const sifre = form.sifre.value;
  const sifre2 = form.sifre2.value;

  if (sifre !== sifre2) {
    new Notification({ text: "Şifreler uyuşmuyor!", type: "error", position: "top-right" });
    return;
  }

  const formData = new FormData(form);
  const isNew = form.id.value === "0";
  formData.append("action", isNew ? "create" : "update");

  try {
    const res = await fetch("/admin/ajax/adminler.php", {
      method: "POST",
      body: formData
    });
    const result = await res.json();

    new Notification({
      text: result.message,
      type: result.status === "success" ? "success" : "error",
      position: "top-right",
      autoClose: 3000,
      showProgress: true
    });

    if (result.status === "success") {
      const username = form.kullanici_adi.value;
      const id = isNew ? result.id : form.id.value;

      if (isNew) {
        const li = document.createElement("li");
        li.className = "bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded cursor-pointer transition";
        li.dataset.id = id;
        li.innerHTML = `<i class="bi bi-person-fill text-gray-600 mr-2"></i> ${username}`;
        adminUl.appendChild(li);

        li.addEventListener("click", () => {
          form.id.value = id;
          form.kullanici_adi.value = username;
          form.sifre.value = "";
          form.sifre2.value = "";

          adminUl.querySelectorAll("li").forEach(item => {
            item.classList.remove("bg-white", "text-black", "pointer-events-none", "shadow-inner");
            item.classList.add("bg-gray-100", "hover:bg-gray-200");
          });

          li.classList.remove("bg-gray-100", "hover:bg-gray-200");
          li.classList.add("bg-white", "text-black", "pointer-events-none", "shadow-inner");

          saveOrUpdateBtn.textContent = "Güncelle";
          newBtn.classList.remove("hidden");
          deleteBtn.classList.remove("hidden");
        });
      } else {
        const existingLi = adminUl.querySelector(`li[data-id="${id}"]`);
        if (existingLi) {
          existingLi.innerHTML = `<i class="bi bi-person-fill text-gray-600 mr-2"></i> ${username}`;
        }
      }

      form.reset();
      form.id.value = "0";
      saveOrUpdateBtn.textContent = "Kaydet";
      newBtn.classList.add("hidden");
      deleteBtn.classList.add("hidden");
    }
  } catch (err) {
    new Notification({ text: "Kayıt hatası: " + err.message, type: "error", position: "top-right" });
  }
});

  // Sil
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Bu admini silmek istediğinizden emin misiniz?")) {
        return;
    }
  const id = form.id.value;
  if (!id || id === "0") return;

  const formData = new FormData();
  formData.append("action", "delete");
  formData.append("id", id);

  try {
    const res = await fetch("/admin/ajax/adminler.php", {
      method: "POST",
      body: formData
    });
    const result = await res.json();

    new Notification({
      text: result.message,
      type: result.status === "success" ? "success" : "error",
      position: "top-right",
      autoClose: 3000,
      showProgress: true
    });

    if (result.status === "success") {
      const li = adminUl.querySelector(`li[data-id="${id}"]`);
      if (li) li.remove();

      form.reset();
      form.id.value = "0";
      saveOrUpdateBtn.textContent = "Kaydet";
      newBtn.classList.add("hidden");
      deleteBtn.classList.add("hidden");
    }
  } catch (err) {
    new Notification({ text: "Silme hatası: " + err.message, type: "error", position: "top-right" });
  }
});
});
</script>