<?php
/**
 * Email sender stub.
 * Production server has the real PHPMailer implementation.
 * This stub allows endpoints to load without fatal errors in dev.
 *
 * sendEmail() — sends a transactional email via PHPMailer (SMTP).
 */

function sendEmail(
    string $fromEmail,
    string $fromName,
    string $toEmail,
    string $subject,
    string $htmlBody,
    ?array $attachment = null
): array {
    // Dev stub — log the attempt, return success-like response.
    error_log("[phpmailer-stub] to=$toEmail subject=$subject");

    return [
        'success' => true,
        'message' => 'Mail gönderimi simüle edildi (dev stub).',
    ];
}
