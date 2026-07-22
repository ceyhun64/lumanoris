<?php
// PHP's built-in dev server falls back to this file for any unmatched
// /api/** request whose deepest existing ancestor directory is this one
// (e.g. a typo'd or removed endpoint) — it was returning 200, so a client
// checking res.ok / status code had no way to detect a bad route.
http_response_code(404);
?>
burası API klasörü