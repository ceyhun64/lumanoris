<?php
header('Content-Type: application/json');
session_start();
require '../functions/db.php';

$database = Database::getInstance();
$conn = $database->getConnection();

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        "authenticated" => true,
        "user_id" => $_SESSION['user_id']
    ]);
    exit;
}

if (isset($_COOKIE['remember_me'])) {
    $parts = explode(':', $_COOKIE['remember_me']);
    if (count($parts) === 2) {
        $selector = $parts[0];
        $validator = $parts[1];

        $tokenData = $database->selectSingle(
            "user_id, hashed_validator FROM user_tokens WHERE selector = ? AND expiry > NOW()",
            [$selector]
        );

        if ($tokenData && hash_equals($tokenData['hashed_validator'], hash('sha256', $validator))) {
            $_SESSION['user_id'] = $tokenData['user_id'];
            echo json_encode([
                "authenticated" => true,
                "user_id" => $_SESSION['user_id']
            ]);
            exit;
        }
    }
}

echo json_encode(["authenticated" => false]);
?>