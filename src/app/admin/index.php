<?php
require($_SERVER['DOCUMENT_ROOT'] . '/functions/util.php');
require($_SERVER['DOCUMENT_ROOT'] . '/admin/functions/tailmind.php');
date_default_timezone_set('Europe/Istanbul');
require_once '../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$currentPath = $_SERVER['REQUEST_URI'];

session_start();
if (empty($_SESSION['csrf_token'])) {
  $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

?>
<?php if (!isset($_SESSION['admin'])): ?>
  <?php include("./partials/_login.php"); ?>
<?php else: ?>
  <?php
  $themes = $database->selectMulti("* FROM themes");
  $theme_index = intval($database->getGlobalVars('theme_index'));
  $current_theme = $themes[$theme_index - 1] ?? $themes[0];
  ?>
  <?php include("./partials/_header.php"); ?>

  <div class="flex lg:flex-row">
    <?php include("./partials/_sidebar.php"); ?>

    <main id="admin-panel-content" class="flex-1 bg-gray-100 min-h-screen p-6 transition-all duration-300">
      <?php
      switch ($currentPath) {
        case '/admin':
        case '/admin/':
          break;
        case '/admin/adminler':
          include 'adminler.php';
          break;
        case '/admin/seo':
          include 'seo.php';
          break;
        case '/admin/sosyalmedya':
          include 'sosyal.php';
          break;
        case '/admin/hit':
          include 'hit.php';
          break;
        case '/admin/smtp':
          include 'smtp.php';
          break;
        case '/admin/genelayar':
          include 'genelayar.php';
          break;
        case '/admin/iletisim':
            include 'iletisim.php';
            break;
        case '/admin/api':
            include 'api.php';
            break;
        case '/admin/chatbotkategoriler':
            include 'chatbotkategoriler.php';
            break;
        case '/admin/kullanicilar':
            include 'kullanicilar.php';
            break;
        case '/admin/chatbotlar':
            include 'chatbotlar.php';
            break;
        case '/admin/hakkinda':
            include 'hakkinda.php';
            break;
      }
      ?>
    </main>
  </div>
  <!-- <footer class="text-center <?= $current_theme['text_color'] ?> py-3 <?= $current_theme['main_color'] ?>">
        <div>
            <p class="mb-0">Alper KUM © 2025 Tüm hakları saklıdır.</p>
        </div>
    </footer> -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const adminNav = document.getElementById('admin-nav');
      const adminPanel = document.getElementById('admin-panel-content');
      const sidebarToggle = document.getElementById('sidebarToggle');
      const toggleButtons = document.querySelectorAll('.toggleButton');

      // Sidebar yüksekliğini admin panel içeriğine göre ayarla
      function updateNavHeight() {
        if (adminPanel && adminNav) {
          adminNav.style.height = `${adminPanel.offsetHeight}px`;
        }
      }

      // Sidebar aç/kapa
      if (sidebarToggle && adminNav) {
        sidebarToggle.addEventListener('click', function() {
          adminNav.classList.toggle('-translate-x-full');
        });
      }

      // Alt menüleri aç/kapa + chevron yönü
      toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
          const contentList = this.nextElementSibling;
          const chevronIcon = this.querySelector('.bi-chevron-down, .bi-chevron-up');

          const isClosed = contentList.style.maxHeight === '0px' || contentList.style.maxHeight === '';

          if (isClosed) {
            contentList.style.maxHeight = contentList.scrollHeight + 'px';
            if (chevronIcon) {
              chevronIcon.classList.remove('bi-chevron-down');
              chevronIcon.classList.add('bi-chevron-up');
            }
          } else {
            contentList.style.maxHeight = '0px';
            if (chevronIcon) {
              chevronIcon.classList.remove('bi-chevron-up');
              chevronIcon.classList.add('bi-chevron-down');
            }
          }
        });
      });

      // Resize olduğunda sidebar yüksekliğini güncelle
      if (adminPanel) {
        const resizeObserver = new ResizeObserver(() => {
          updateNavHeight();
        });
        resizeObserver.observe(adminPanel);
      }

      updateNavHeight();
    });
  </script>
  </body>

  </html>
<?php endif; ?>