<?php
require($_SERVER['DOCUMENT_ROOT'] . '/functions/db.php');
$database = Database::getInstance();
$conn = $database->getConnection();

require '../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * sendEmail 2.0
 * @param string $fromEmail Gönderen e-posta
 * @param string $fromName  Gönderen isim
 * @param mixed  $toAddresses Alıcı (string veya array)
 * @param string $subject   Konu
 * @param string $body      HTML gövde
 * @param array|null $attachments Dosya ekleri (örn. $_FILES['file'])
 */
function sendEmail($fromEmail, $fromName, $toAddresses, $subject, $body, $attachments = null) {
    global $database;
    $smtp_vals = $database->getGlobalVars("smtp_host","smtp_email","smtp_pass");
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $smtp_vals['smtp_host'];
        $mail->SMTPAuth = true;
        $mail->SMTPDebug = 2;
        $mail->Debugoutput = 'error_log';
        $mail->Username = $smtp_vals['smtp_email'];
        $mail->Password = $smtp_vals['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;

        $mail->setFrom($fromEmail, $fromName);

        if (is_array($toAddresses)) {
            foreach ($toAddresses as $address) {
                $mail->addAddress($address);
            }
        } else {
            $mail->addAddress($toAddresses);
        }

        $mail->CharSet = 'UTF-8';
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        // Dosya ekleme
        if ($attachments && isset($attachments['tmp_name'])) {
            // Tek dosya
            if (is_array($attachments['tmp_name'])) {
                // Çoklu dosya
                foreach ($attachments['tmp_name'] as $idx => $tmpPath) {
                    if (!empty($tmpPath)) {
                        $mail->addAttachment($tmpPath, $attachments['name'][$idx]);
                    }
                }
            } else {
                // Tek dosya
                if (!empty($attachments['tmp_name'])) {
                    $mail->addAttachment($attachments['tmp_name'], $attachments['name']);
                }
            }
        }

        $mail->send();
        return [
            'success' => true,
            'message' => 'Mesaj başarıyla gönderildi!'
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Mesaj gönderilemedi. Hata: ' . $mail->ErrorInfo
        ];
    }
}
?>