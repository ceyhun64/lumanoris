<?php
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_FILES["file"])) {
    $baseDir = "../uploads/";
    $subdir  = $_POST['subdir'] ?? ""; // örn: "avatars", "docs", "2025/12"

    // Güvenlik: sadece harf, rakam, tire, alt çizgi ve / izin verelim
    $subdir = preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $subdir);

    // Hedef klasör
    $targetDir = rtrim($baseDir, "/") . "/" . ltrim($subdir, "/");
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    $fileName = basename($_FILES["file"]["name"]);
    $targetFile = $targetDir . "/" . $fileName;

    try {
        // Boyut kontrolü (örnek: max 5MB)
        if ($_FILES["file"]["size"] > 5 * 1024 * 1024) {
            echo json_encode([
                "success" => false,
                "message" => "File size exceeds 5MB limit."
            ]);
            exit;
        }

        // İzin verilen uzantılar
        $allowed = ["jpg","jpeg","png","gif","pdf","doc","docx","txt"];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) {
            echo json_encode([
                "success" => false,
                "message" => "File type not allowed."
            ]);
            exit;
        }

        if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
            echo json_encode([
                "success" => true,
                "message" => "File uploaded successfully.",
                "file"    => $fileName,
                "path"    => $targetFile
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Error moving uploaded file."
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "No file uploaded."
    ]);
}
?>