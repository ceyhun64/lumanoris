<?php
if ($_SERVER["REQUEST_METHOD"] == "POST")
{
    if(!csrf_check($_POST['csrf_token']))
    {
        echo '<script>alert("Geçersiz istek (CSRF hatası)!");</script>';
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        exit();
    }
    if(!isset($_SESSION['admin']))
    {
        $admin_adi = $_POST['admin_adi'];
        $admin_sifre = $_POST['admin_sifre'];
        $admin_bilgi = $database->selectSingle("* FROM adminler WHERE kullanici_adi = ?", [$admin_adi]);
        if($admin_bilgi && password_verify($admin_sifre, $admin_bilgi['sifre']))
        {
            $_SESSION['admin'] = $admin_adi;
            header("Location: /admin/");
            exit();
        }
        else
        {
            echo '<script>alert("Geçersiz kullanıcı adı veya şifre");</script>';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Girişi</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/admin/assets/css/notification.css">
  <link rel="stylesheet" href="/admin/assets/css/notifs.css">
  <script src="/admin/assets/js/Notification.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
</head>
<body class="min-h-screen bg-gradient-to-br from-white to-gray-200 flex items-center justify-center">
  <div class="w-full max-w-lg mx-auto">
    <div class="bg-white shadow-lg rounded-lg overflow-hidden">
      
      <!-- Header -->
      <div class="bg-black text-center p-6 rounded-t-lg">
        <h4 class="text-white text-xl font-semibold mb-1">Admin Paneline Giriş</h4>
        <p class="text-gray-400 text-sm">Devam etmek için oturum açın.</p>
      </div>

      <!-- Body -->
      <div class="p-6">
        <form id="login-form" action="" method="POST" class="space-y-4">
          <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token']; ?>">

          <div>
            <label for="admin_adi" class="block text-gray-700 font-medium mb-1">Kullanıcı Adı</label>
            <input type="text" id="admin_adi" name="admin_adi" placeholder="Kullanıcı adınızı girin" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-250">
          </div>

          <div>
            <label for="admin_sifre" class="block text-gray-700 font-medium mb-1">Şifre</label>
            <input type="password" id="admin_sifre" name="admin_sifre" placeholder="Şifrenizi girin" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-250">
          </div>

          <div>
            <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition duration-250 flex items-center justify-center gap-2">
              <i class="bi bi-box-arrow-in-right text-lg"></i> Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- JS aynı şekilde -->
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.querySelector("#login-form");
      const csrfToken = document.querySelector('input[name="csrf_token"]').value;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        formData.append("csrf_token", csrfToken);

        try {
          const response = await fetch("/admin/ajax/giris.php", {
            method: "POST",
            body: formData,
            credentials: "same-origin"
          });

          const respText = await response.text();
          console.log(respText);
          const data = /*await response.json()*/ JSON.parse(respText);
          

          new Notification({
            text: data.message,
            position: "top-right",
            type: data.status == "success" ? "success" : "error",
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
</body>
</html>