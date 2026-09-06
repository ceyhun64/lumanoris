<?php
/**
 * Bootstraps shared infrastructure and registers the class autoloader.
 * Supports the full Clean Architecture directory tree under api/src/.
 *
 * Every API endpoint thin-wrapper starts with:
 *   require_once __DIR__ . '/../src/autoload.php';
 */

require_once __DIR__ . '/../functions/bootstrap.php';
require_once __DIR__ . '/../functions/validators.php';
require_once __DIR__ . '/../functions/rate_limit.php';

// AppException.php defines 8 exception classes in one file (AppException,
// AuthException, ValidationException, NotFoundException, PermissionException,
// LimitReachedException, DuplicateException, PaymentException) — the
// autoloader below only matches one class per file by filename, so any of
// the 7 siblings would throw "Class not found" if referenced before
// AppException itself happened to be autoloaded first. Load unconditionally.
require_once __DIR__ . '/Shared/Exceptions/AppException.php';

/**
 * H-05 — bu liste 31 dizin sayıyordu ve 11'i diskte HİÇ YOKTU
 * (Application/UseCases/{Marketplace,Social,Chat,Note,Content,Notification,
 * Training,Message,Seller,Contact}, Domain/Services). Autoloader her sınıf
 * çözümlemesinde bu yolları tek tek `file_exists()` ile deniyordu; yani her
 * istekte onlarca boşa dosya sistemi çağrısı, ve daha kötüsü, dizin listesi
 * mimarinin gerçek hâlini değil bir YOL HARİTASINI anlatıyordu.
 *
 * Liste artık yalnızca var olan ve sınıf barındıran dizinleri içeriyor.
 * Yeni bir katman açıldığında buraya bir satır eklenmesi gerekiyor — bu
 * bilinçli: dizinin gerçekten var olduğu tek yerde doğrulanıyor.
 */
spl_autoload_register(function (string $class): void {
    static $searchDirs = null;
    if ($searchDirs === null) {
        $base = __DIR__;
        $searchDirs = [
            // Presentation
            "$base/Presentation/Controllers/",
            "$base/Presentation/Middleware/",
            "$base/Presentation/Response/",
            // Application — yalnızca Auth'ta use case var; kalan alt
            // dizinler henüz yazılmadı, mantık controller'larda duruyor.
            "$base/Application/UseCases/Auth/",
            // Domain
            "$base/Domain/Interfaces/",
            // Infrastructure
            "$base/Infrastructure/Database/",
            "$base/Infrastructure/Repositories/",
            "$base/Infrastructure/Payment/",
            // Shared
            "$base/Shared/Constants/",
            "$base/Shared/Exceptions/",
            "$base/Shared/Utilities/",
        ];
    }

    foreach ($searchDirs as $dir) {
        $file = $dir . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});
