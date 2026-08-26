<?php
require_once __DIR__ . '/../functions/logging.php';
configure_error_log();
require_once __DIR__ . '/../functions/util.php';
require_once __DIR__ . '/functions/tailmind.php';
date_default_timezone_set('Europe/Istanbul');
require_once '../functions/db.php';
$database = Database::getInstance();
$conn = $database->getConnection();

// The admin panel turned display_errors on unconditionally, regardless of
// APP_DEBUG — so in production a PHP notice or warning would be printed into
// the page (and, for anything that emits JSON, into the response body). Honour
// the same flag the API's exception handler uses; errors are logged either way.
$adminDebug = strtolower((string) ($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?: '')) === 'true';
ini_set('display_errors', $adminDebug ? '1' : '0');
ini_set('display_startup_errors', $adminDebug ? '1' : '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

$currentPath = $_SERVER['REQUEST_URI'];

// Route table, resolved before any output. The switch that used to do this ran
// after the header partial had already been echoed, so a 404 status could not
// be sent from there at all ("headers already sent") — and with no default
// branch an unknown /admin/* path rendered an empty 200 byte-identical to
// /admin/. Deciding the route up here makes the status code possible.
$adminRoutes = [
    '/admin'                    => null,   // dashboard root, no sub-page
    '/admin/'                   => null,
    '/admin/adminler'           => 'adminler.php',
    '/admin/seo'                => 'seo.php',
    '/admin/sosyalmedya'        => 'sosyal.php',
    '/admin/hit'                => 'hit.php',
    '/admin/smtp'               => 'smtp.php',
    '/admin/genelayar'          => 'genelayar.php',
    '/admin/iletisim'           => 'iletisim.php',
    '/admin/api'                => 'api.php',
    '/admin/chatbotkategoriler' => 'chatbotkategoriler.php',
    '/admin/kullanicilar'       => 'kullanicilar.php',
    '/admin/chatbotlar'         => 'chatbotlar.php',
    '/admin/chatbotistatistik'  => 'chatbotistatistik.php',
    '/admin/chatayar'           => 'chatayar.php',
    '/admin/abonelik'           => 'abonelik.php',
    '/admin/odemeentegrasyon'   => 'odemeentegrasyon.php',
    '/admin/anasayfa'           => 'anasayfa.php',
    '/admin/hakkinda'           => 'hakkinda.php',
    '/admin/kullanimkosullari'  => 'kullanimkosullari.php',
    '/admin/gizlilikpolitikasi' => 'gizlilikpolitikasi.php',
    '/admin/teslimatiade'       => 'teslimatiade.php',
    '/admin/satiskosullari'     => 'satiskosullari.php',
];

$routePath  = strtok($currentPath, '?');
$routeKnown = array_key_exists($routePath, $adminRoutes);
if (!$routeKnown) {
    http_response_code(404);
}

require_once __DIR__ . '/functions/session.php';
admin_session_start();
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
      if (!$routeKnown) {
          echo '<div class="rounded-xl bg-white p-8 text-center text-gray-600 shadow">'
             . '<p class="text-lg font-semibold text-gray-800">Sayfa bulunamadı</p>'
             . '<p class="mt-2 text-sm">Aradığınız yönetim sayfası mevcut değil.</p>'
             . '</div>';
      } elseif ($adminRoutes[$routePath] !== null) {
          include $adminRoutes[$routePath];
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
            // Önce scrollHeight kadar aç
            contentList.style.maxHeight = contentList.scrollHeight + "px";
            
            // Animasyon bittikten sonra limiti kaldır (böylece içerik asla kesilmez)
            contentList.addEventListener('transitionend', function once() {
              if (contentList.style.maxHeight !== '0px') {
                contentList.style.maxHeight = 'none';
              }
              contentList.removeEventListener('transitionend', once);
            });

            if (chevronIcon) {
              chevronIcon.classList.replace('bi-chevron-down', 'bi-chevron-up');
            }
          } else {
            // Kapatırken 'none' ise önce tekrar sayısal değere çekmeliyiz ki animasyon çalışsın
            if (contentList.style.maxHeight === 'none') {
              contentList.style.maxHeight = contentList.scrollHeight + 'px';
              // Tarayıcının render etmesi için minik bir saniye beklet (reflow)
              contentList.offsetHeight; 
            }
            
            contentList.style.maxHeight = '0px';
            if (chevronIcon) {
              chevronIcon.classList.replace('bi-chevron-up', 'bi-chevron-down');
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
