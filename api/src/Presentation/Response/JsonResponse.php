<?php
/**
 * Standardised HTTP JSON response helper.
 * Replaces the global json_success() / json_error() functions with a class so
 * Use Cases and Controllers can call it the same way without globals.
 *
 * Error format: {success:false, message:"...", error_code:"SCREAMING_SNAKE"}
 * Success format: {success:true, ...payload}
 */
final class JsonResponse {
    public static function success(array $data = [], int $status = 200): void {
        http_response_code($status);
        echo json_encode(
            array_merge(['success' => true], $data),
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    public static function error(
        string $message,
        int    $status     = 400,
        string $errorCode  = '',
        array  $extra      = []
    ): void {
        http_response_code($status);
        $body = ['success' => false, 'message' => $message];
        if ($errorCode !== '') {
            $body['error_code'] = $errorCode;
        }
        echo json_encode(
            array_merge($body, $extra),
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    /** Renders the correct error response from any AppException subclass. */
    public static function fromException(AppException $e): void {
        $errorCode = self::codeForException($e);
        $extra = [];
        if ($e instanceof ValidationException && count($e->getErrors()) > 0) {
            $extra['errors'] = $e->getErrors();
        }
        self::error($e->getMessage(), $e->getCode() ?: 400, $errorCode, $extra);
    }

    private static function codeForException(AppException $e): string {
        return match (true) {
            $e instanceof ValidationException  => AppConfig::ERR_VALIDATION,
            $e instanceof AuthException        => AppConfig::ERR_AUTH_REQUIRED,
            $e instanceof NotFoundException    => AppConfig::ERR_NOT_FOUND,
            $e instanceof PermissionException  => AppConfig::ERR_PERMISSION,
            $e instanceof LimitReachedException => AppConfig::ERR_LIMIT_REACHED,
            $e instanceof DuplicateException   => AppConfig::ERR_DUPLICATE,
            $e instanceof PaymentException     => AppConfig::ERR_PAYMENT,
            default                            => AppConfig::ERR_SERVER,
        };
    }
}
