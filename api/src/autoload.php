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

// AppException.php defines 8 exception classes in one file (AppException,
// AuthException, ValidationException, NotFoundException, PermissionException,
// LimitReachedException, DuplicateException, PaymentException) — the
// autoloader below only matches one class per file by filename, so any of
// the 7 siblings would throw "Class not found" if referenced before
// AppException itself happened to be autoloaded first. Load unconditionally.
require_once __DIR__ . '/Shared/Exceptions/AppException.php';

spl_autoload_register(function (string $class): void {
    static $searchDirs = null;
    if ($searchDirs === null) {
        $base = __DIR__;
        $searchDirs = [
            // Presentation
            "$base/Presentation/Controllers/",
            "$base/Presentation/Middleware/",
            "$base/Presentation/Response/",
            // Application
            "$base/Application/UseCases/Auth/",
            "$base/Application/UseCases/Chatbot/",
            "$base/Application/UseCases/User/",
            "$base/Application/UseCases/Wallet/",
            "$base/Application/UseCases/Marketplace/",
            "$base/Application/UseCases/Social/",
            "$base/Application/UseCases/Chat/",
            "$base/Application/UseCases/Note/",
            "$base/Application/UseCases/Content/",
            "$base/Application/UseCases/Notification/",
            "$base/Application/UseCases/Training/",
            "$base/Application/UseCases/Message/",
            "$base/Application/UseCases/Seller/",
            "$base/Application/UseCases/Contact/",
            "$base/Application/DTO/",
            "$base/Application/Validators/",
            // Domain
            "$base/Domain/Interfaces/",
            "$base/Domain/Entities/",
            "$base/Domain/Services/",
            // Infrastructure
            "$base/Infrastructure/Database/",
            "$base/Infrastructure/Repositories/",
            "$base/Infrastructure/Mail/",
            "$base/Infrastructure/Payment/",
            "$base/Infrastructure/FileStorage/",
            "$base/Infrastructure/Cache/",
            // Shared
            "$base/Shared/Constants/",
            "$base/Shared/Exceptions/",
            "$base/Shared/Utilities/",
            // Legacy (backward-compat while transitioning)
            "$base/Controllers/",
            "$base/Config/",
            "$base/Middleware/",
            "$base/Repositories/",
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
