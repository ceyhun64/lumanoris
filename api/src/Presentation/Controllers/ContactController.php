<?php
class ContactController {
    public static function submit(): void {
        require_method('POST');
        require_once __DIR__ . '/../../../functions/phpmailer.php';

        checkRateLimit(Database::getInstance(), 'contact:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 5, 600);

        $fullName = InputSanitizer::text($_POST['fullName'] ?? '', 100);
        $email    = InputSanitizer::email($_POST['email'] ?? '');
        $subject  = InputSanitizer::text($_POST['subject'] ?? '', 200);
        $message  = InputSanitizer::text($_POST['message'] ?? '', 5000);

        // Sanitize for HTML output (XSS prevention)
        $safeName    = htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8');
        $safeEmail   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
        $safeSubject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));

        $body = "<p><strong>Ad Soyad:</strong> $safeName</p>
                 <p><strong>Email:</strong> $safeEmail</p>
                 <p><strong>Konu:</strong> $safeSubject</p>
                 <p><strong>Mesaj:</strong><br/>$safeMessage</p>";

        $result = sendEmail($email, $fullName, AppConfig::contactEmail(), $subject, $body, $_FILES['file'] ?? null);
        echo json_encode($result);
        exit;
    }
}
