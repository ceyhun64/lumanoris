<?php
class AppException extends RuntimeException {}

class ValidationException extends AppException {
    public function __construct(string $message, int $code = 400) {
        parent::__construct($message, $code);
    }
}

class AuthException extends AppException {
    public function __construct(string $message = 'Oturum açmanız gerekiyor.', int $code = 401) {
        parent::__construct($message, $code);
    }
}

class NotFoundException extends AppException {
    public function __construct(string $message = 'Kayıt bulunamadı.', int $code = 404) {
        parent::__construct($message, $code);
    }
}

class PermissionException extends AppException {
    public function __construct(string $message = 'Bu işlem için yetkiniz yok.', int $code = 403) {
        parent::__construct($message, $code);
    }
}
