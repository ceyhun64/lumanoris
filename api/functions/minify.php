<?php
/**
 * ⚠️ I-07 — SİLME ADAYI. `minify_html()`'in sıfır çağıranı var (üçlü arama:
 * `web/src`, `api/admin`, `api/router.php`) ve dosyayı hiçbir yer `require`
 * etmiyor. Silinmedi: "ölü kod mu, bilerek duran yardımcı mı" kararı ürün
 * tarafında (AUDIT.md, Belirsizlikler #3).
 *
 * NOT: kullanılacaksa dikkat — `/\s+/` düzeni `<pre>`, `<textarea>` ve inline
 * `<script>` içeriğini de ezer.
 */
function minify_html($html) {
    $html = preg_replace('/>\s+</', '><', $html);
    $html = preg_replace('/\s+/', ' ', $html);
    $html = str_replace(["\n", "\r", "\t"], '', $html);

    return $html;
}
?>