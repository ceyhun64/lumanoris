<?php
// PHP's built-in dev server falls back to this file for any unmatched
// /api/** request whose deepest existing ancestor directory is this one
// (e.g. a typo'd or removed endpoint) — it was returning 200, so a client
// checking res.ok / status code had no way to detect a bad route.
//
// The status was fixed but the body stayed plain text ("burası API klasörü"),
// and every endpoint under /api answers JSON. Most of the frontend's fetch
// calls do JSON.parse(await res.text()), so a wrong route surfaced as a
// SyntaxError that hid the real cause. Answer in the same shape as every other
// endpoint so a 404 reads as a 404.
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success'    => false,
    'message'    => 'Böyle bir API uç noktası yok.',
    'error_code' => 'NOT_FOUND',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
