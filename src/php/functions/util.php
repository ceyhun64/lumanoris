<?php
function snull($string)
{
    return trim($string) != "";
}
function msnull(...$strings)
{
    foreach ($strings as $s) {
        if (trim($s) == "") return false;
    }
    return true;
}
function slimit($string,$limit)
{
    return mb_strlen($string, 'UTF-8') > $limit ? mb_substr($string, 0, $limit, 'UTF-8') . "..." : $string;
}
function stitle($string)
{
    return mb_convert_case($string,MB_CASE_TITLE,"UTF-8");
}
function go_back_js()
{
    echo "<script>window.history.back();</script>";
}
function csrf_check($csrf_token)
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $csrf_token);
}
function reencode(string $string, string $from, string $to = 'UTF-8'): string
{
    if (!is_string($string)) {
        throw new InvalidArgumentException("reencode: Beklenen string, ama '" . gettype($string) . "' geldi.");
    }

    $converted = @mb_convert_encoding($string, $to, $from);

    if ($converted === false || preg_match('/Ã|�|�|�/', $converted)) {
        throw new RuntimeException("reencode: Encoding restore başarısız. '$from' → '$to' dönüşümünde semantik kayma tespit edildi. Veri: '$string'");
    }

    return $converted;
}
function terminate($message = '', $code = 1) {
    if ($message !== '') {
        $GLOBALS['exit_message'] = $message;
    }
    exit($code);
}
register_shutdown_function(function () {
    if (isset($GLOBALS['exit_message'])) {
        error_log("Çıkış mesajı: " . $GLOBALS['exit_message']);
    }
});
?>