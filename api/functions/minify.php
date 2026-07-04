<?php
function minify_html($html) {
    $html = preg_replace('/>\s+</', '><', $html);
    $html = preg_replace('/\s+/', ' ', $html);
    $html = str_replace(["\n", "\r", "\t"], '', $html);

    return $html;
}
?>