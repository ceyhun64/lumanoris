<?php
/**
 * Base exception hierarchy.
 * Every domain error extends AppException so controllers can catch one type.
 */
class AppException extends RuntimeException {}

class ValidationException extends AppException {
    private array $errors;

    public function __construct(string $message, array $errors = [], int $code = 400) {
        parent::__construct($message, $code);
        $this->errors = $errors;
    }

    public function getErrors(): array { return $this->errors; }
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

class LimitReachedException extends AppException {
    public function __construct(string $message = 'Limit doldu.', int $code = 422) {
        parent::__construct($message, $code);
    }
}

class DuplicateException extends AppException {
    public function __construct(string $message = 'Kayıt zaten mevcut.', int $code = 409) {
        parent::__construct($message, $code);
    }
}

class PaymentException extends AppException {
    public function __construct(string $message = 'Ödeme işlemi başarısız.', int $code = 402) {
        parent::__construct($message, $code);
    }
}
