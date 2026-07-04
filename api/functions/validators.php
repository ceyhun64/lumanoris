<?php
/**
 * Input validation & sanitization helpers.
 * Include after bootstrap.php.
 */

function require_fields(array $data, array $fields): void {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
            json_error("Eksik alan: $field", 400);
        }
    }
}

function sanitize_string(?string $value, int $maxLength = 255): string {
    $value = trim($value ?? '');
    if (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }
    return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function sanitize_int($value): int {
    return (int) filter_var($value, FILTER_SANITIZE_NUMBER_INT);
}

function sanitize_float($value): float {
    return (float) filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
}

function validate_email(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validate_positive_int($value): bool {
    return filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) !== false;
}

function allowed_values($value, array $allowedList): bool {
    return in_array($value, $allowedList, true);
}
