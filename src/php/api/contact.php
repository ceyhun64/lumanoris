<?php
header('Content-Type: application/json');

require '../functions/phpmailer.php'; // sendEmail 2.0 fonksiyonunu kullanacağız

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $fullName = $_POST['fullName'] ?? '';
    $email    = $_POST['email'] ?? '';
    $subject  = $_POST['subject'] ?? '';
    $message  = $_POST['message'] ?? '';

    // Mail body
    $body = "<p><strong>Ad Soyad:</strong> {$fullName}</p>
             <p><strong>Email:</strong> {$email}</p>
             <p><strong>Konu:</strong> {$subject}</p>
             <p><strong>Mesaj:</strong><br/>" . nl2br($message) . "</p>";

    // Mail gönder (dosya varsa $_FILES['file'] parametresi ile eklenir)
    $result = sendEmail(
        $email,
        $fullName,
        "alperkum.cs@gmail.com", // alıcı adres
        $subject,
        $body,
        $_FILES['file'] ?? null
    );

    echo json_encode($result);
}
?>