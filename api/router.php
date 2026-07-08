<?php
// Router for PHP's built-in dev server, replicating admin/.htaccess:
// serve real files/dirs as-is, otherwise route /admin/* to admin/index.php.
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . $uri;

if ($uri !== '/' && (is_file($file) || is_dir($file))) {
    return false; // let the built-in server handle it directly
}

if (strpos($uri, '/admin') === 0) {
    $_SERVER['REQUEST_URI'] = $uri;
    require __DIR__ . '/admin/index.php';
    return true;
}

return false;
